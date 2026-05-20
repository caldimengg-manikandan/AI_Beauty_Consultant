from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class ServiceItem(BaseModel):
    name: str
    price: float = 0.0
    duration_mins: int = 60
    category: str = "General"  # Hair | Skin | Spa | Makeup | Nail


class SalonCreate(BaseModel):
    name: str
    owner_name: str
    phone: str
    email: str
    address: str
    city: str
    pincode: str
    salon_type: str                   # "parlour" | "salon" | "spa"
    gender_served: str                # "Female" | "Male" | "Unisex"
    description: Optional[str] = ""
    services_offered: Optional[List[str]] = []
    opening_time: Optional[str] = "9:00 AM"
    closing_time: Optional[str] = "8:00 PM"
    slot_duration_minutes: Optional[int] = 60
    max_concurrent_slots: Optional[int] = 3
    # Geo-location (set when owner registers with coords)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    google_place_id: Optional[str] = None
    # Structured services with pricing
    services_with_pricing: Optional[List[ServiceItem]] = []
    # For price-range filtering (auto-calculated from services_with_pricing if provided)
    avg_service_price: Optional[float] = 0.0
    # Social / media
    instagram_url: Optional[str] = None
    website_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    gst_number: Optional[str] = None
    verification_status: Optional[str] = "pending" # pending | verified | rejected


class SalonUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    description: Optional[str] = None
    services_offered: Optional[List[str]] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    slot_duration_minutes: Optional[int] = None
    max_concurrent_slots: Optional[int] = None
    is_active: Optional[bool] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    services_with_pricing: Optional[List[ServiceItem]] = None
    avg_service_price: Optional[float] = None
    instagram_url: Optional[str] = None
    website_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    gst_number: Optional[str] = None
    verification_status: Optional[str] = None


class ReviewCreate(BaseModel):
    salon_id: str
    rating: int   # 1-5
    comment: str


class SlotBookingCreate(BaseModel):
    salon_id: str
    service_name: str
    customer_name: str
    customer_phone: str
    appointment_date: str
    appointment_time: str
    price: Optional[float] = None
    category: Optional[str] = None
    gender: Optional[str] = None
    notes: Optional[str] = ""
    # Payment fields
    payment_status: Optional[str] = "pending"  # pending | paid | refunded
    payment_id: Optional[str] = None
    amount: Optional[float] = None
