import logging
_log = logging.getLogger("beauty_api.appointment")

from fastapi import APIRouter, HTTPException, Depends, Query
from app.schemas.appointment import AppointmentCreate
from app.mongodb.collections import appointments_collection, slot_bookings_collection
from app.auth.jwt_handler import get_current_user
from datetime import datetime, timedelta
import uuid

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])

@router.post("/book")
async def book_appointment(appointment: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    # Check for existing booking at the same date, time, and service
    existing_booking = appointments_collection.find_one({
        "appointment_date": appointment.appointment_date,
        "appointment_time": appointment.appointment_time,
        "service_name": appointment.service_name
    })

    if existing_booking:
        raise HTTPException(
            status_code=400,
            detail=f"Sorry, the '{appointment.service_name}' slot at {appointment.appointment_time} on {appointment.appointment_date} is already booked by another customer. Please choose a different time or service."
        )

    # Create new booking
    booking_ref = "BK-" + str(uuid.uuid4().hex[:8]).upper()
    new_booking = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.get("sub") if current_user else "guest",
        "booking_ref": booking_ref,
        "created_at": datetime.utcnow(),
        **appointment.dict()
    }

    appointments_collection.insert_one(new_booking)

    # Convert BSON _id to string for response
    new_booking.pop("_id", None)
    return {
        "status": "success",
        "message": "Appointment booked successfully!",
        "booking_ref": booking_ref,
        "data": new_booking
    }

@router.get("/my-bookings")
async def get_my_bookings(current_user: dict = Depends(get_current_user)):
    bookings = list(appointments_collection.find({"user_id": current_user.get("sub")}))
    for b in bookings:
        b.pop("_id", None)
    return bookings


@router.get("/upcoming")
async def get_upcoming_bookings(
    filter: str = Query("today", description="today | tomorrow | week"),
    current_user: dict = Depends(get_current_user),
):
    """
    Returns slot bookings for the shop owner's salon filtered by date range.
    Used by Client Intelligence to show today's / tomorrow's / this week's clients.
    """
    from app.mongodb.collections import salons_collection
    user_id = current_user.get("sub")

    # Resolve the owner's salon
    salon = salons_collection.find_one({"owner_email": user_id})
    if not salon:
        return {"appointments": [], "filter": filter}

    salon_id = salon.get("id")
    today = datetime.utcnow().date()

    if filter == "today":
        date_from = today
        date_to   = today
    elif filter == "tomorrow":
        date_from = today + timedelta(days=1)
        date_to   = today + timedelta(days=1)
    else:  # week
        date_from = today
        date_to   = today + timedelta(days=6)

    from_str = date_from.strftime("%Y-%m-%d")
    to_str   = date_to.strftime("%Y-%m-%d")

    bookings = list(
        slot_bookings_collection.find(
            {
                "salon_id": salon_id,
                "status": {"$in": ["confirmed", "pending"]},
                "appointment_date": {"$gte": from_str, "$lte": to_str},
            },
            {
                "_id": 0,
                "id": 1,
                "user_id": 1,
                "client_name": 1,
                "service_name": 1,
                "appointment_date": 1,
                "appointment_time": 1,
                "status": 1,
                "booking_ref": 1,
            },
        ).sort("appointment_date", 1).limit(100)
    )

    # Normalise field names for the frontend card
    for b in bookings:
        b.setdefault("client_name",   b.get("user_id", "Client"))
        b.setdefault("service",       b.get("service_name", ""))
        b.setdefault("time",          b.get("appointment_time", ""))

    return {"appointments": bookings, "filter": filter, "count": len(bookings)}
