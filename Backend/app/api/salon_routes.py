from fastapi import APIRouter, HTTPException, Depends, Query
from app.schemas.salon import SalonCreate, SalonUpdate, ReviewCreate, SlotBookingCreate
from app.mongodb.collections import (
    salons_collection, reviews_collection,
    slot_bookings_collection, users_collection
)
from app.auth.jwt_handler import get_current_user
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/salons", tags=["Salon Marketplace"])

# ─────────────────────────────────────────────────────────────────────────────
# HELPER
# ─────────────────────────────────────────────────────────────────────────────

def _strip_id(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


def _avg_rating(salon_id: str) -> float:
    reviews = list(reviews_collection.find({"salon_id": salon_id}))
    if not reviews:
        return 0.0
    return round(sum(r["rating"] for r in reviews) / len(reviews), 1)


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC — Browse / Search Salons
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/")
async def list_salons(
    city: str = Query(None, description="Filter by city"),
    salon_type: str = Query(None, description="parlour | salon | spa"),
    gender_served: str = Query(None, description="Female | Male | Unisex"),
    search: str = Query(None, description="Search by name or address"),
    page: int = Query(1, ge=1),
    limit: int = Query(12, le=50),
):
    query: dict = {"is_active": True}

    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if salon_type:
        query["salon_type"] = salon_type
    if gender_served:
        query["gender_served"] = {"$in": [gender_served, "Unisex"]}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"address": {"$regex": search, "$options": "i"}},
        ]

    skip = (page - 1) * limit
    salons = list(salons_collection.find(query).skip(skip).limit(limit))
    total = salons_collection.count_documents(query)

    result = []
    for s in salons:
        s = _strip_id(s)
        s["avg_rating"] = _avg_rating(s["id"])
        s["review_count"] = reviews_collection.count_documents({"salon_id": s["id"]})
        result.append(s)

    return {"salons": result, "total": total, "page": page, "pages": -(-total // limit)}


@router.get("/{salon_id}")
async def get_salon(salon_id: str):
    salon = salons_collection.find_one({"id": salon_id})
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    salon = _strip_id(salon)
    salon["avg_rating"] = _avg_rating(salon_id)
    salon["review_count"] = reviews_collection.count_documents({"salon_id": salon_id})
    return salon


@router.get("/{salon_id}/reviews")
async def get_salon_reviews(salon_id: str):
    reviews = list(reviews_collection.find({"salon_id": salon_id}).sort("created_at", -1))
    return [_strip_id(r) for r in reviews]


@router.get("/{salon_id}/available-slots")
async def get_available_slots(salon_id: str, date: str = Query(...)):
    salon = salons_collection.find_one({"id": salon_id})
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    # All possible time slots between opening and closing
    from datetime import datetime, time, timedelta
    try:
        open_dt = datetime.strptime(salon.get("opening_time", "9:00 AM"), "%I:%M %p")
        close_dt = datetime.strptime(salon.get("closing_time", "8:00 PM"), "%I:%M %p")
    except Exception:
        open_dt = datetime.strptime("9:00 AM", "%I:%M %p")
        close_dt = datetime.strptime("8:00 PM", "%I:%M %p")

    slot_minutes = salon.get("slot_duration_minutes", 60)
    max_concurrent = salon.get("max_concurrent_slots", 3)

    slots = []
    current = open_dt
    while current < close_dt:
        label = current.strftime("%I:%M %p").lstrip("0")
        # Count bookings at this slot
        booked_count = slot_bookings_collection.count_documents({
            "salon_id": salon_id,
            "appointment_date": date,
            "appointment_time": label,
            "status": {"$in": ["confirmed", "pending"]},
        })
        slots.append({
            "time": label,
            "available": booked_count < max_concurrent,
            "spots_left": max(0, max_concurrent - booked_count),
        })
        current += timedelta(minutes=slot_minutes)

    return {"date": date, "slots": slots}


# ─────────────────────────────────────────────────────────────────────────────
# USER — Book a slot at a specific salon
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/book-slot")
async def book_slot(
    booking: SlotBookingCreate,
    current_user: dict = Depends(get_current_user),
):
    salon = salons_collection.find_one({"id": booking.salon_id})
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    max_concurrent = salon.get("max_concurrent_slots", 3)
    booked_count = slot_bookings_collection.count_documents({
        "salon_id": booking.salon_id,
        "appointment_date": booking.appointment_date,
        "appointment_time": booking.appointment_time,
        "status": {"$in": ["confirmed", "pending"]},
    })

    if booked_count >= max_concurrent:
        raise HTTPException(
            status_code=400,
            detail=f"The {booking.appointment_time} slot on {booking.appointment_date} is fully booked. Please choose another time."
        )

    booking_ref = "SB-" + str(uuid.uuid4().hex[:8]).upper()
    new_booking = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.get("sub", "guest"),
        "booking_ref": booking_ref,
        "salon_name": salon.get("name"),
        "salon_address": salon.get("address"),
        "status": "confirmed",
        "created_at": datetime.utcnow(),
        **booking.dict(),
    }
    slot_bookings_collection.insert_one(new_booking)
    new_booking.pop("_id", None)

    return {
        "status": "success",
        "message": "Slot booked successfully!",
        "booking_ref": booking_ref,
        "data": new_booking,
    }


@router.get("/my-slot-bookings")
async def my_slot_bookings(current_user: dict = Depends(get_current_user)):
    bookings = list(slot_bookings_collection.find(
        {"user_id": current_user.get("sub")}
    ).sort("created_at", -1))
    return [_strip_id(b) for b in bookings]


# ─────────────────────────────────────────────────────────────────────────────
# USER — Submit a review
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/reviews")
async def submit_review(
    review: ReviewCreate,
    current_user: dict = Depends(get_current_user),
):
    salon = salons_collection.find_one({"id": review.salon_id})
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    if not 1 <= review.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    existing = reviews_collection.find_one({
        "salon_id": review.salon_id,
        "user_id": current_user.get("sub"),
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this salon.")

    user = users_collection.find_one({"_id": current_user.get("sub")}) or {}
    new_review = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.get("sub"),
        "user_name": user.get("name", current_user.get("sub", "Anonymous")),
        "salon_id": review.salon_id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": datetime.utcnow(),
    }
    reviews_collection.insert_one(new_review)
    new_review.pop("_id", None)

    # Update salon's cached rating
    salons_collection.update_one(
        {"id": review.salon_id},
        {"$set": {"avg_rating": _avg_rating(review.salon_id)}}
    )

    return {"status": "success", "message": "Review submitted!", "data": new_review}


# ─────────────────────────────────────────────────────────────────────────────
# SHOP OWNER — Register / Manage their salon
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/register")
async def register_salon(
    salon: SalonCreate,
    current_user: dict = Depends(get_current_user),
):
    # Check if this user already owns a salon
    existing = salons_collection.find_one({"owner_user_id": current_user.get("sub")})
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You already have a registered salon. Update it instead."
        )

    salon_id = str(uuid.uuid4())
    new_salon = {
        "id": salon_id,
        "owner_user_id": current_user.get("sub"),
        "is_active": True,
        "avg_rating": 0.0,
        "created_at": datetime.utcnow(),
        **salon.dict(),
    }
    salons_collection.insert_one(new_salon)
    new_salon.pop("_id", None)

    # Upgrade user role to "shop_owner"
    users_collection.update_one(
        {"_id": current_user.get("sub")},
        {"$set": {"role": "shop_owner", "salon_id": salon_id}}
    )

    return {
        "status": "success",
        "message": "Salon registered successfully!",
        "salon_id": salon_id,
        "data": new_salon,
    }


@router.get("/owner/my-salon")
async def get_my_salon(current_user: dict = Depends(get_current_user)):
    salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")})
    if not salon:
        raise HTTPException(status_code=404, detail="No salon found for this account")
    salon = _strip_id(salon)
    salon["avg_rating"] = _avg_rating(salon["id"])
    salon["review_count"] = reviews_collection.count_documents({"salon_id": salon["id"]})
    return salon


@router.put("/owner/update")
async def update_my_salon(
    updates: SalonUpdate,
    current_user: dict = Depends(get_current_user),
):
    salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")})
    if not salon:
        raise HTTPException(status_code=404, detail="No salon found for this account")

    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    salons_collection.update_one(
        {"owner_user_id": current_user.get("sub")},
        {"$set": update_data}
    )
    return {"status": "success", "message": "Salon updated"}


@router.get("/owner/bookings")
async def get_owner_bookings(
    current_user: dict = Depends(get_current_user),
    date: str = Query(None),
    status: str = Query(None),
):
    salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")})
    if not salon:
        raise HTTPException(status_code=404, detail="No salon found for this account")

    query: dict = {"salon_id": salon["id"]}
    if date:
        query["appointment_date"] = date
    if status:
        query["status"] = status

    bookings = list(slot_bookings_collection.find(query).sort("appointment_date", 1))
    return [_strip_id(b) for b in bookings]


@router.patch("/owner/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    status: str,
    current_user: dict = Depends(get_current_user),
):
    if status not in ["confirmed", "cancelled", "completed", "pending"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")})
    if not salon:
        raise HTTPException(status_code=404, detail="No salon found")

    result = slot_bookings_collection.update_one(
        {"id": booking_id, "salon_id": salon["id"]},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")

    return {"status": "success", "message": f"Booking marked as {status}"}
