"""
Staff Management Routes — Salon Partner B2B
Handles: staff CRUD, attendance, shift assignment, commission tracking
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from app.mongodb.collections import (
    staff_collection, salons_collection,
    slot_bookings_collection, commissions_collection
)
from app.auth.jwt_handler import get_current_user
from app.auth.rbac import require_shop_owner
import uuid

router = APIRouter(
    prefix="/api/staff",
    tags=["Staff Management"],
    dependencies=[__import__('fastapi').Depends(require_shop_owner)]
)


# ── Schemas ───────────────────────────────────────────────────────────────────

class StaffCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    role: str = "stylist"            # stylist | receptionist | manager | assistant
    specializations: List[str] = []  # ["hair", "nails", "facial"]
    experience_years: int = 0
    commission_rate: float = 0.0     # percentage 0-100
    base_salary: float = 15000.0     # monthly base salary
    shift_start: str = "09:00"
    shift_end: str = "18:00"
    days_off: List[str] = []         # ["Sunday", "Monday"]
    profile_photo: Optional[str] = None

class StaffUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    specializations: Optional[List[str]] = None
    experience_years: Optional[int] = None
    commission_rate: Optional[float] = None
    base_salary: Optional[float] = None
    shift_start: Optional[str] = None
    shift_end: Optional[str] = None
    days_off: Optional[List[str]] = None
    is_active: Optional[bool] = None

class AttendanceRecord(BaseModel):
    staff_id: str
    date: str           # YYYY-MM-DD
    status: str         # present | absent | half_day | leave
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    notes: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_owner_salon(current_user: dict):
    salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")})
    if not salon:
        raise HTTPException(status_code=404, detail="No salon found for this account")
    return salon

def _strip(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


# ── CRUD ──────────────────────────────────────────────────────────────────────

@router.get("/")
async def list_staff(current_user: dict = Depends(get_current_user)):
    """List all staff for the owner's salon."""
    salon = _get_owner_salon(current_user)
    staff = list(staff_collection.find({"salon_id": salon["id"]}).sort("name", 1))
    return [_strip(s) for s in staff]


@router.post("/")
async def add_staff(staff: StaffCreate, current_user: dict = Depends(get_current_user)):
    """Add a new staff member."""
    salon = _get_owner_salon(current_user)
    if staff_collection.find_one({"salon_id": salon["id"], "phone": staff.phone, "is_active": True}):
        raise HTTPException(status_code=400, detail="A staff member with this phone already exists")
    new_staff = {
        "id": str(uuid.uuid4()),
        "salon_id": salon["id"],
        "is_active": True,
        "attendance": [],
        "total_earnings": 0.0,
        "bookings_handled": 0,
        "created_at": datetime.utcnow(),
        **staff.dict()
    }
    staff_collection.insert_one(new_staff)
    new_staff.pop("_id", None)
    return {"status": "success", "message": "Staff added successfully", "data": new_staff}


@router.get("/{staff_id}")
async def get_staff(staff_id: str, current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)
    member = staff_collection.find_one({"id": staff_id, "salon_id": salon["id"]})
    if not member:
        raise HTTPException(status_code=404, detail="Staff not found")
    return _strip(member)


@router.put("/{staff_id}")
async def update_staff(staff_id: str, updates: StaffUpdate, current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = staff_collection.update_one(
        {"id": staff_id, "salon_id": salon["id"]},
        {"$set": {**update_data, "updated_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Staff not found")
    return {"status": "success", "message": "Staff updated"}


@router.delete("/{staff_id}")
async def deactivate_staff(staff_id: str, current_user: dict = Depends(get_current_user)):
    """Soft delete — marks staff as inactive."""
    salon = _get_owner_salon(current_user)
    result = staff_collection.update_one(
        {"id": staff_id, "salon_id": salon["id"]},
        {"$set": {"is_active": False, "deactivated_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Staff not found")
    return {"status": "success", "message": "Staff deactivated"}


# ── Attendance ─────────────────────────────────────────────────────────────────

@router.post("/attendance")
async def mark_attendance(record: AttendanceRecord, current_user: dict = Depends(get_current_user)):
    """Mark attendance for a staff member."""
    salon = _get_owner_salon(current_user)
    member = staff_collection.find_one({"id": record.staff_id, "salon_id": salon["id"]})
    if not member:
        raise HTTPException(status_code=404, detail="Staff not found")
    attendance_entry = {
        "id": str(uuid.uuid4()),
        **record.dict(),
        "recorded_by": current_user.get("sub"),
        "created_at": datetime.utcnow()
    }
    staff_collection.update_one(
        {"id": record.staff_id},
        {"$push": {"attendance": attendance_entry}}
    )
    return {"status": "success", "message": "Attendance recorded", "data": attendance_entry}


@router.get("/{staff_id}/attendance")
async def get_staff_attendance(
    staff_id: str,
    month: str = Query(None, description="YYYY-MM"),
    current_user: dict = Depends(get_current_user)
):
    salon = _get_owner_salon(current_user)
    member = staff_collection.find_one({"id": staff_id, "salon_id": salon["id"]})
    if not member:
        raise HTTPException(status_code=404, detail="Staff not found")
    attendance = member.get("attendance", [])
    if month:
        attendance = [a for a in attendance if a.get("date", "").startswith(month)]
    present = sum(1 for a in attendance if a.get("status") in ["present", "half_day"])
    absent  = sum(1 for a in attendance if a.get("status") == "absent")
    return {
        "staff_id": staff_id,
        "staff_name": member.get("name"),
        "month": month,
        "records": attendance,
        "summary": {"present": present, "absent": absent, "total_days": len(attendance)}
    }


# ── Commissions ────────────────────────────────────────────────────────────────

@router.get("/{staff_id}/commissions")
async def get_staff_commissions(
    staff_id: str,
    month: str = Query(None, description="YYYY-MM"),
    current_user: dict = Depends(get_current_user)
):
    """Calculate commission for a staff member from completed bookings."""
    salon = _get_owner_salon(current_user)
    member = staff_collection.find_one({"id": staff_id, "salon_id": salon["id"]})
    if not member:
        raise HTTPException(status_code=404, detail="Staff not found")

    query = {"salon_id": salon["id"], "stylist_id": staff_id, "status": "completed"}
    if month:
        query["appointment_date"] = {"$regex": f"^{month}"}
    bookings = list(slot_bookings_collection.find(query))

    commission_rate = member.get("commission_rate", 0.0) / 100
    total_revenue   = sum(b.get("service_price", 0) for b in bookings)
    commission_amt  = round(total_revenue * commission_rate, 2)

    return {
        "staff_id": staff_id,
        "staff_name": member.get("name"),
        "commission_rate": f"{member.get('commission_rate', 0)}%",
        "month": month,
        "completed_bookings": len(bookings),
        "total_revenue_generated": total_revenue,
        "commission_amount": commission_amt,
        "bookings": [{
            "booking_ref": b.get("booking_ref"),
            "service": b.get("service_name"),
            "price": b.get("service_price", 0),
            "date": b.get("appointment_date")
        } for b in bookings]
    }


@router.get("/analytics/overview")
async def staff_analytics(current_user: dict = Depends(get_current_user)):
    """Overall staff performance analytics for the salon."""
    salon = _get_owner_salon(current_user)
    all_staff = list(staff_collection.find({"salon_id": salon["id"], "is_active": True}))
    result = []
    for member in all_staff:
        bookings = list(slot_bookings_collection.find({
            "salon_id": salon["id"],
            "stylist_id": member["id"],
            "status": "completed"
        }))
        member.pop("_id", None)
        result.append({
            "id": member["id"],
            "name": member["name"],
            "role": member.get("role"),
            "completed_bookings": len(bookings),
            "total_revenue": sum(b.get("service_price", 0) for b in bookings),
            "avg_rating": member.get("avg_rating", 0),
            "specializations": member.get("specializations", [])
        })
    result.sort(key=lambda x: x["completed_bookings"], reverse=True)
    return {"staff": result, "total_active": len(all_staff)}
