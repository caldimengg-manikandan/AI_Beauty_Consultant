from fastapi import APIRouter, HTTPException, Depends
from app.schemas.appointment import AppointmentCreate
from app.mongodb.collections import appointments_collection
from app.auth.jwt_handler import get_current_user
from datetime import datetime
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
