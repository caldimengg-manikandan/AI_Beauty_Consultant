from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class AppointmentBase(BaseModel):
    service_name: str
    customer_name: str
    appointment_date: str  # Format: YYYY-MM-DD
    appointment_time: str  # Format: HH:MM AM/PM
    category: Optional[str] = None
    gender: str  # Male/Female
    status: Optional[str] = "PENDING"  # PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW
    stylist_id: Optional[str] = None
    salon_id: Optional[str] = None
    coupon_code: Optional[str] = None
    total_amount: Optional[float] = None

class AppointmentCreate(AppointmentBase):
    pass

class Appointment(AppointmentBase):
    id: str
    booking_ref: str
    created_at: datetime
    user_id: Optional[str] = None
