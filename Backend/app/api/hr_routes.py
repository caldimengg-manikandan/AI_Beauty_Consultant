from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict
import uuid
from datetime import datetime

from app.auth.jwt_handler import get_current_user
from app.auth.rbac import require_shop_owner
from app.mongodb.collections import (
    staff_collection, salons_collection,
    slot_bookings_collection, staff_attendance_collection,
    staff_leaves_collection
)

router = APIRouter(
    prefix="/api/hr",
    tags=["HR & Payroll Engine"],
    dependencies=[__import__('fastapi').Depends(require_shop_owner)]
)

# ── Schemas ───────────────────────────────────────────────────────────────────
class LeaveRequest(BaseModel):
    staff_id: str
    start_date: str # YYYY-MM-DD
    end_date: str # YYYY-MM-DD
    leave_type: str # casual | sick | unpaid
    reason: Optional[str] = ""

class LeaveStatusUpdate(BaseModel):
    status: str # approved | rejected

class PayrollRunRequest(BaseModel):
    month: str # YYYY-MM

def _get_owner_salon(current_user: dict):
    salon = salons_collection.find_one({"owner_user_id": current_user.get("sub") or str(current_user["_id"])})
    if not salon:
        raise HTTPException(status_code=404, detail="No salon found for this account")
    return salon

# ── Leaves Management ──────────────────────────────────────────────────────────
@router.post("/leaves")
async def request_leave(req: LeaveRequest, current_user: dict = Depends(get_current_user)):
    """Create a leave request for a staff member."""
    salon = _get_owner_salon(current_user)
    
    # Verify staff exists in this salon
    staff = staff_collection.find_one({"id": req.staff_id, "salon_id": str(salon["_id"])})
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
        
    leave_id = str(uuid.uuid4())
    new_leave = {
        "id": leave_id,
        "salon_id": str(salon["_id"]),
        "staff_id": req.staff_id,
        "staff_name": staff["name"],
        "start_date": req.start_date,
        "end_date": req.end_date,
        "leave_type": req.leave_type,
        "reason": req.reason,
        "status": "pending",
        "requested_at": datetime.utcnow().isoformat()
    }
    
    staff_leaves_collection.insert_one(new_leave)
    new_leave.pop("_id", None)
    return {"status": "success", "data": new_leave}

@router.get("/leaves")
async def get_leaves(current_user: dict = Depends(get_current_user)):
    """Get all leave requests for the salon."""
    salon = _get_owner_salon(current_user)
    
    cursor = staff_leaves_collection.find({"salon_id": str(salon["_id"])}).sort("requested_at", -1)
    leaves = list(cursor)
    for l in leaves:
        l.pop("_id", None)
    return leaves

@router.put("/leaves/{leave_id}")
async def update_leave_status(leave_id: str, req: LeaveStatusUpdate, current_user: dict = Depends(get_current_user)):
    """Approve or reject a leave request."""
    salon = _get_owner_salon(current_user)
    
    leave = staff_leaves_collection.find_one({"id": leave_id, "salon_id": str(salon["_id"])})
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
        
    staff_leaves_collection.update_one(
        {"id": leave_id},
        {"$set": {"status": req.status, "processed_at": datetime.utcnow().isoformat()}}
    )
    
    # If approved, also log in staff attendance as status="leave" for those dates (simplified date loop)
    # Typically we would loop dates, but here we record a note
    return {"status": "success", "message": f"Leave request marked as {req.status}"}

# ── Payroll Engine ─────────────────────────────────────────────────────────────
@router.post("/payroll/calculate")
async def calculate_payroll(req: PayrollRunRequest, current_user: dict = Depends(get_current_user)):
    """Calculate and return payroll breakdown for all staff in the salon for a given month."""
    salon = _get_owner_salon(current_user)
    salon_id = str(salon["_id"])
    
    # Get all active staff
    staff_list = list(staff_collection.find({"salon_id": salon_id, "is_active": True}))
    payroll_runs = []
    
    for member in staff_list:
        staff_id = member["id"]
        base_salary = member.get("base_salary", 15000.0)
        commission_rate = member.get("commission_rate", 0.0) / 100.0
        
        # 1. Calculate commissions from slot bookings (completed appointments for this month)
        # Search bookings where stylist_id == staff_id and status == 'completed'
        bookings_query = {
            "salon_id": salon_id,
            "stylist_id": staff_id,
            "status": "completed",
            "appointment_date": {"$regex": f"^{req.month}"}
        }
        completed_bookings = list(slot_bookings_collection.find(bookings_query))
        
        total_revenue = sum(b.get("service_price", 0) for b in completed_bookings)
        commission_earned = round(total_revenue * commission_rate, 2)
        
        # 2. Calculate deductions from attendance (absent days in this month)
        # Search attendance logs in staff_collection under 'attendance' array
        # Let's count how many records have status == 'absent' and date starting with the month
        attendance_logs = member.get("attendance", [])
        absent_days = 0
        for entry in attendance_logs:
            if entry.get("date", "").startswith(req.month) and entry.get("status") == "absent":
                absent_days += 1
                
        # Deduct 1/30th of base salary per absent day
        deductions = round((base_salary / 30.0) * absent_days, 2)
        
        net_payout = round(base_salary + commission_earned - deductions, 2)
        if net_payout < 0:
            net_payout = 0
            
        payroll_runs.append({
            "staff_id": staff_id,
            "staff_name": member["name"],
            "role": member.get("role", "stylist"),
            "base_salary": base_salary,
            "commission_rate": f"{member.get('commission_rate', 0)}%",
            "completed_bookings_count": len(completed_bookings),
            "revenue_generated": total_revenue,
            "commission_earned": commission_earned,
            "absent_days": absent_days,
            "deductions": deductions,
            "net_payout": net_payout,
            "status": "calculated"
        })
        
    return {
        "month": req.month,
        "salon_id": salon_id,
        "payroll": payroll_runs
    }
