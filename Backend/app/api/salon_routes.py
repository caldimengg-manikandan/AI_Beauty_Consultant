import logging
_log = logging.getLogger("beauty_api.salon")

from app.utils.upload_validator import validate_image_upload
from fastapi import APIRouter, HTTPException, Depends, Query, File, UploadFile
from typing import List
from app.schemas.salon import SalonCreate, SalonUpdate, ReviewCreate, SlotBookingCreate
from app.mongodb.collections import (
    salons_collection, reviews_collection,
    slot_bookings_collection, users_collection
)
from app.auth.jwt_handler import get_current_user
from app.utils.salon_cache import (       # cache additions — non-breaking
    get_list_cache, set_list_cache,
    get_detail_cache, set_detail_cache,
    get_slot_cache, set_slot_cache,
    invalidate_salon, invalidate_slot_cache_for_salon,
)
from app.utils.salon_events import log_event, _slim  # event logging — non-breaking
from app.mongodb.collections import salon_events_collection  # audit log collection
from datetime import datetime
import uuid
import math
import os
import httpx

router = APIRouter(prefix="/api/salons", tags=["Salon Marketplace"])

GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "")

# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _strip_id(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


def _avg_rating(salon_id: str) -> float:
    reviews = list(reviews_collection.find({"salon_id": salon_id}))
    if not reviews:
        return 0.0
    return round(sum(r["rating"] for r in reviews) / len(reviews), 1)


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Returns distance in kilometres between two GPS coordinates."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _enrich(salon: dict, user_lat: float = None, user_lon: float = None) -> dict:
    salon = _strip_id(salon)
    salon["avg_rating"] = _avg_rating(salon["id"])
    salon["review_count"] = reviews_collection.count_documents({"salon_id": salon["id"]})
    if user_lat is not None and user_lon is not None:
        s_lat = salon.get("latitude")
        s_lon = salon.get("longitude")
        if s_lat is not None and s_lon is not None:
            salon["distance_km"] = round(_haversine_km(user_lat, user_lon, s_lat, s_lon), 2)
        else:
            salon["distance_km"] = None
    # ── Filter inactive services for customer-facing reads ───────────────────
    # Customers only see services where is_active is True (or missing — legacy docs).
    # The raw services_with_pricing array (incl. inactive) remains in MongoDB unchanged.
    if "services_with_pricing" in salon:
        salon["services_with_pricing"] = [
            s for s in salon["services_with_pricing"]
            if s.get("is_active", True)  # treat missing key as active (backward compat)
        ]
    return salon


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC — Browse / Search Salons
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/")
async def list_salons(
    city: str = Query(None),
    salon_type: str = Query(None, description="parlour | salon | spa"),
    gender_served: str = Query(None, description="Female | Male | Unisex"),
    search: str = Query(None),
    min_rating: float = Query(None, ge=0, le=5),
    price_range: str = Query(None, description="budget | mid | premium"),
    sort_by: str = Query("created_at", description="created_at | rating | distance"),
    lat: float = Query(None),
    lon: float = Query(None),
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
    if price_range:
        PRICE_MAP = {
            "budget":  {"min": 0,    "max": 500},
            "mid":     {"min": 500,  "max": 2000},
            "premium": {"min": 2000, "max": 999999},
        }
        if price_range in PRICE_MAP:
            query["avg_service_price"] = {
                "$gte": PRICE_MAP[price_range]["min"],
                "$lte": PRICE_MAP[price_range]["max"],
            }

    # ── Cache check (non-breaking: falls through to DB on any error) ────────────
    _cache_params = {"city": city, "salon_type": salon_type, "gender_served": gender_served,
                     "search": search, "min_rating": min_rating, "price_range": price_range,
                     "sort_by": sort_by, "lat": lat, "lon": lon, "page": page, "limit": limit}
    try:
        _cached = get_list_cache(_cache_params)
        if _cached is not None:
            return _cached
    except Exception:
        pass

    skip = (page - 1) * limit
    salons = list(salons_collection.find(query).skip(skip).limit(limit))
    total = salons_collection.count_documents(query)
    result = [_enrich(s, lat, lon) for s in salons]

    if min_rating is not None:
        result = [s for s in result if (s.get("avg_rating") or 0) >= min_rating]
    if sort_by == "rating":
        result.sort(key=lambda s: s.get("avg_rating") or 0, reverse=True)
    elif sort_by == "distance" and lat is not None and lon is not None:
        result.sort(key=lambda s: s.get("distance_km") or 9999)

    response = {"salons": result, "total": total, "page": page, "pages": -(-total // limit)}
    try:
        set_list_cache(_cache_params, response)
    except Exception:
        pass
    return response


# ─────────────────────────────────────────────────────────────────────────────
# NEARBY — Geo-radius search (registered salons with lat/lon)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/nearby")
async def nearby_salons(
    lat: float = Query(...),
    lon: float = Query(...),
    radius_km: float = Query(10.0),
    salon_type: str = Query(None),
    gender_served: str = Query(None),
    min_rating: float = Query(None, ge=0, le=5),
    limit: int = Query(20, le=50),
):
    """Return registered salons within radius_km of the user, sorted by distance."""
    query: dict = {"is_active": True}
    if salon_type:
        query["salon_type"] = salon_type
    if gender_served:
        query["gender_served"] = {"$in": [gender_served, "Unisex"]}

    nearby = []
    for s in salons_collection.find(query):
        s_lat, s_lon = s.get("latitude"), s.get("longitude")
        if s_lat is None or s_lon is None:
            continue
        dist = _haversine_km(lat, lon, s_lat, s_lon)
        if dist <= radius_km:
            enriched = _enrich(s, lat, lon)
            enriched["distance_km"] = round(dist, 2)
            nearby.append(enriched)

    nearby.sort(key=lambda s: s.get("distance_km") or 9999)
    if min_rating is not None:
        nearby = [s for s in nearby if (s.get("avg_rating") or 0) >= min_rating]

    return {"salons": nearby[:limit], "total": len(nearby), "radius_km": radius_km}


# ─────────────────────────────────────────────────────────────────────────────
# GOOGLE PLACES PROXY — Real beauty parlours from Google Maps
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/google-places")
async def google_places_nearby(
    lat: float = Query(...),
    lon: float = Query(...),
    radius_m: int = Query(5000),
    keyword: str = Query("beauty parlour salon spa"),
):
    """Proxy: fetches real Google Places results near user coordinates."""
    if not GOOGLE_PLACES_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Google Places API key not configured. Add GOOGLE_PLACES_API_KEY to Backend/.env"
        )
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        "location": f"{lat},{lon}",
        "radius": radius_m,
        "keyword": keyword,
        "type": "beauty_salon",
        "key": GOOGLE_PLACES_API_KEY,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, params=params)
    data = resp.json()

    registered_ids = {
        s.get("google_place_id")
        for s in salons_collection.find({}, {"google_place_id": 1})
        if s.get("google_place_id")
    }

    places = []
    for p in data.get("results", []):
        loc = p.get("geometry", {}).get("location", {})
        dist = None
        if loc.get("lat") and loc.get("lng"):
            dist = round(_haversine_km(lat, lon, loc["lat"], loc["lng"]), 2)
        place_id = p.get("place_id")
        places.append({
            "google_place_id": place_id,
            "name":            p.get("name"),
            "address":         p.get("vicinity"),
            "avg_rating":      p.get("rating"),
            "review_count":    p.get("user_ratings_total"),
            "open_now":        p.get("opening_hours", {}).get("open_now"),
            "photo_ref":       (p.get("photos") or [{}])[0].get("photo_reference"),
            "latitude":        loc.get("lat"),
            "longitude":       loc.get("lng"),
            "distance_km":     dist,
            "is_registered":   place_id in registered_ids,
            "source":          "google",
        })

    places.sort(key=lambda p: p.get("distance_km") or 9999)
    return {"places": places, "count": len(places)}


@router.get("/google-places/photo")
async def google_place_photo(photo_ref: str = Query(...), max_width: int = Query(400)):
    if not GOOGLE_PLACES_API_KEY:
        raise HTTPException(status_code=503, detail="Google API key not configured")
    url = (
        f"https://maps.googleapis.com/maps/api/place/photo"
        f"?maxwidth={max_width}&photo_reference={photo_ref}&key={GOOGLE_PLACES_API_KEY}"
    )
    return {"photo_url": url}


# ─────────────────────────────────────────────────────────────────────────────
# SINGLE SALON + REVIEWS + SLOTS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/my-slot-bookings")
async def my_slot_bookings(
    current_user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
):
    query = {"user_id": current_user.get("sub")}
    total = slot_bookings_collection.count_documents(query)
    skip = (page - 1) * limit
    bookings = list(
        slot_bookings_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
    )
    return {
        "bookings": [_strip_id(b) for b in bookings],
        "total": total,
        "page": page,
        "pages": -(-total // limit),
    }


@router.patch("/my-slot-bookings/{booking_id}/cancel")
async def cancel_my_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    result = slot_bookings_collection.update_one(
        {"id": booking_id, "user_id": current_user.get("sub"),
         "status": {"$in": ["confirmed", "pending"]}},
        {"$set": {"status": "cancelled", "updated_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found or already cancelled")
    return {"status": "success", "message": "Booking cancelled"}


@router.get("/my-wishlist")
async def get_wishlist(current_user: dict = Depends(get_current_user)):
    user = users_collection.find_one({"email": current_user.get("sub")}) or {}
    wishlist = user.get("salon_wishlist", [])
    salons = [_enrich(s) for s in salons_collection.find({"id": {"$in": wishlist}})]
    return {"wishlist": salons}


@router.get("/owner/my-salon")
async def get_my_salon(current_user: dict = Depends(get_current_user)):
    salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")})
    if not salon:
        raise HTTPException(status_code=404, detail="No salon found for this account")
    return _enrich(salon)


@router.put("/owner/update")
async def update_my_salon(updates: SalonUpdate, current_user: dict = Depends(get_current_user)):
    salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")})
    if not salon:
        raise HTTPException(status_code=404, detail="No salon found for this account")
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    before_snap = _slim(salon)
    salons_collection.update_one(
        {"owner_user_id": current_user.get("sub")}, {"$set": update_data}
    )
    after_salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")}) or {}
    # Invalidate cache so customers see the update on their next request
    try:
        invalidate_salon(salon["id"], salon.get("city"))
    except Exception:
        pass
    # Event log — non-blocking
    log_event(
        salon_events_collection,
        salon_id=salon["id"],
        actor_id=current_user.get("sub"),
        actor_role=current_user.get("role", "shop_owner"),
        action="SALON_UPDATED",
        field_changes={k: {"after": v} for k, v in update_data.items()},
        before_snapshot=before_snap,
        after_snapshot=_slim(after_salon),
    )
    return {"status": "success", "message": "Salon updated"}


@router.get("/owner/bookings")
async def get_owner_bookings(
    current_user: dict = Depends(get_current_user),
    date: str = Query(None),
    status: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, le=200),
):
    salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")})
    if not salon:
        raise HTTPException(status_code=404, detail="No salon found for this account")
    query: dict = {"salon_id": salon["id"]}
    if date:
        query["appointment_date"] = date
    if status:
        query["status"] = status
    total = slot_bookings_collection.count_documents(query)
    skip = (page - 1) * limit
    bookings = list(
        slot_bookings_collection.find(query).sort("appointment_date", 1).skip(skip).limit(limit)
    )
    return {
        "bookings": [_strip_id(b) for b in bookings],
        "total": total,
        "page": page,
        "pages": -(-total // limit),
    }


@router.patch("/owner/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str, status: str, current_user: dict = Depends(get_current_user)
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


@router.get("/owner/analytics")
async def owner_analytics(current_user: dict = Depends(get_current_user)):
    salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")})
    if not salon:
        raise HTTPException(status_code=404, detail="No salon found")
    all_bookings = list(slot_bookings_collection.find({"salon_id": salon["id"]}))
    total     = len(all_bookings)
    confirmed = sum(1 for b in all_bookings if b.get("status") == "confirmed")
    cancelled = sum(1 for b in all_bookings if b.get("status") == "cancelled")
    completed = sum(1 for b in all_bookings if b.get("status") == "completed")
    from collections import Counter
    service_counter = Counter(b.get("service_name", "Unknown") for b in all_bookings)
    top_services = [{"service": k, "count": v} for k, v in service_counter.most_common(5)]
    return {
        "salon_name":         salon.get("name"),
        "total_bookings":     total,
        "confirmed_bookings": confirmed,
        "cancelled_bookings": cancelled,
        "completed_bookings": completed,
        "avg_rating":         _avg_rating(salon["id"]),
        "review_count":       reviews_collection.count_documents({"salon_id": salon["id"]}),
        "top_services":       top_services,
    }


# Parameterised routes AFTER fixed paths to avoid FastAPI routing conflicts
@router.get("/{salon_id}")
async def get_salon(salon_id: str):
    try:
        _cached = get_detail_cache(salon_id)
        if _cached is not None:
            return _cached
    except Exception:
        pass
    salon = salons_collection.find_one({"id": salon_id})
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    result = _enrich(salon)
    try:
        set_detail_cache(salon_id, result)
    except Exception:
        pass
    return result


@router.get("/{salon_id}/reviews")
async def get_salon_reviews(
    salon_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
):
    query = {"salon_id": salon_id}
    total = reviews_collection.count_documents(query)
    skip = (page - 1) * limit
    reviews = list(
        reviews_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
    )
    return {
        "reviews": [_strip_id(r) for r in reviews],
        "total": total,
        "page": page,
        "pages": -(-total // limit),
    }


@router.get("/{salon_id}/available-slots")
async def get_available_slots(salon_id: str, date: str = Query(...)):
    salon = salons_collection.find_one({"id": salon_id})
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    from datetime import timedelta
    try:
        open_dt  = datetime.strptime(salon.get("opening_time",  "9:00 AM"), "%I:%M %p")
        close_dt = datetime.strptime(salon.get("closing_time",  "8:00 PM"), "%I:%M %p")
    except Exception:
        open_dt  = datetime.strptime("9:00 AM", "%I:%M %p")
        close_dt = datetime.strptime("8:00 PM", "%I:%M %p")

    slot_minutes   = salon.get("slot_duration_minutes", 60)
    max_concurrent = salon.get("max_concurrent_slots",  3)
    # Slot cache check
    try:
        _slot_cached = get_slot_cache(salon_id, date)
        if _slot_cached is not None:
            return _slot_cached
    except Exception:
        pass

    slots, current = [], open_dt
    while current < close_dt:
        label = current.strftime("%I:%M %p").lstrip("0")
        booked_count = slot_bookings_collection.count_documents({
            "salon_id": salon_id, "appointment_date": date,
            "appointment_time": label, "status": {"$in": ["confirmed", "pending"]},
        })
        slots.append({
            "time": label,
            "available": booked_count < max_concurrent,
            "spots_left": max(0, max_concurrent - booked_count),
        })
        current += timedelta(minutes=slot_minutes)
    slot_result = {"date": date, "slots": slots}
    try:
        set_slot_cache(salon_id, date, slot_result)
    except Exception:
        pass
    return slot_result


# ─────────────────────────────────────────────────────────────────────────────
# USER — Book / Reviews / Wishlist
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/book-slot")
async def book_slot(booking: SlotBookingCreate, current_user: dict = Depends(get_current_user)):
    salon = salons_collection.find_one({"id": booking.salon_id})
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    max_concurrent = salon.get("max_concurrent_slots", 3)
    booked_count   = slot_bookings_collection.count_documents({
        "salon_id": booking.salon_id,
        "appointment_date": booking.appointment_date,
        "appointment_time": booking.appointment_time,
        "status": {"$in": ["confirmed", "pending"]},
    })
    if booked_count >= max_concurrent:
        raise HTTPException(
            status_code=400,
            detail=f"The {booking.appointment_time} slot on {booking.appointment_date} is fully booked."
        )
    booking_ref = "SB-" + str(uuid.uuid4().hex[:8]).upper()
    new_booking = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.get("sub", "guest"),
        "booking_ref": booking_ref,
        "salon_name":    salon.get("name"),
        "salon_address": salon.get("address"),
        "salon_phone":   salon.get("phone"),
        "salon_city":    salon.get("city"),
        "status": "pending",          # promoted to "confirmed" after payment
        "payment_status": "pending",
        "created_at": datetime.utcnow(),
        **booking.dict(),
    }
    slot_bookings_collection.insert_one(new_booking)
    new_booking.pop("_id", None)
    return {"status": "success", "message": "Slot booked successfully!", "booking_ref": booking_ref, "booking_id": new_booking["id"], "data": new_booking}


@router.post("/reviews")
async def submit_review(review: ReviewCreate, current_user: dict = Depends(get_current_user)):
    salon = salons_collection.find_one({"id": review.salon_id})
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    if not 1 <= review.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    if reviews_collection.find_one({"salon_id": review.salon_id, "user_id": current_user.get("sub")}):
        raise HTTPException(status_code=400, detail="You have already reviewed this salon.")
    user = users_collection.find_one({"email": current_user.get("sub")}) or {}
    new_review = {
        "id": str(uuid.uuid4()), "user_id": current_user.get("sub"),
        "user_name": user.get("name", current_user.get("sub", "Anonymous")),
        "salon_id": review.salon_id, "rating": review.rating,
        "comment": review.comment, "created_at": datetime.utcnow(),
    }
    reviews_collection.insert_one(new_review)
    new_review.pop("_id", None)
    salons_collection.update_one({"id": review.salon_id}, {"$set": {"avg_rating": _avg_rating(review.salon_id)}})
    return {"status": "success", "message": "Review submitted!", "data": new_review}


@router.post("/{salon_id}/wishlist")
async def toggle_wishlist(salon_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    user    = users_collection.find_one({"email": user_id}) or {}
    wishlist: list = user.get("salon_wishlist", [])
    if salon_id in wishlist:
        wishlist.remove(salon_id); action = "removed"
    else:
        wishlist.append(salon_id); action = "added"
    users_collection.update_one({"email": user_id}, {"$set": {"salon_wishlist": wishlist}})
    return {"status": "success", "action": action, "wishlist": wishlist}


# ─────────────────────────────────────────────────────────────────────────────
# SHOP OWNER — Register
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/register")
async def register_salon(salon: SalonCreate, current_user: dict = Depends(get_current_user)):
    if salons_collection.find_one({"owner_user_id": current_user.get("sub")}):
        raise HTTPException(status_code=400, detail="You already have a registered salon.")
    salon_id  = str(uuid.uuid4())
    
    salon_dict = salon.dict()
    if salon_dict.get("latitude") is None or salon_dict.get("longitude") is None:
        city_lower = salon_dict.get("city", "").lower()
        coords = {
            "chennai": (13.0827, 80.2707),
            "bangalore": (12.9716, 77.5946),
            "mumbai": (19.0760, 72.8777),
            "hyderabad": (17.3850, 78.4867),
            "pune": (18.5204, 73.8567),
            "delhi": (28.7041, 77.1025),
            "kolkata": (22.5726, 88.3639)
        }
        lat, lon = coords.get(city_lower, (20.5937, 78.9629))
        salon_dict["latitude"] = lat
        salon_dict["longitude"] = lon

    new_salon = {
        "id": salon_id, "owner_user_id": current_user.get("sub"),
        "is_active": True, "is_verified": True, "avg_rating": 0.0,
        "created_at": datetime.utcnow(), **salon_dict,
    }
    salons_collection.insert_one(new_salon)
    new_salon.pop("_id", None)
    users_collection.update_one(
        {"email": current_user.get("sub")},
        {"$set": {"role": "shop_owner", "salon_id": salon_id}}
    )
    
    try:
        invalidate_salon(salon_id)
    except Exception:
        pass

    # Event log — non-blocking
    log_event(
        salon_events_collection,
        salon_id=salon_id,
        actor_id=current_user.get("sub"),
        actor_role="shop_owner",
        action="SALON_REGISTERED",
        after_snapshot=_slim(new_salon),
    )
    return {
        "status": "success",
        "message": "Salon registered successfully! It is now live.",
        "salon_id": salon_id, "data": new_salon,
    }


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN — Verify / Deactivate
# ─────────────────────────────────────────────────────────────────────────────

@router.patch("/admin/{salon_id}/verify")
async def verify_salon(salon_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    salons_collection.update_one(
        {"id": salon_id}, {"$set": {"is_verified": True, "verified_at": datetime.utcnow()}}
    )
    invalidate_salon(salon_id)  # make salon visible in customer listings
    log_event(
        salon_events_collection,
        salon_id=salon_id,
        actor_id=current_user.get("sub"),
        actor_role="admin",
        action="SALON_VERIFIED",
        field_changes={"is_verified": {"before": False, "after": True}},
    )
    return {"status": "success", "message": "Salon verified"}


@router.patch("/admin/{salon_id}/deactivate")
async def deactivate_salon(salon_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    salons_collection.update_one({"id": salon_id}, {"$set": {"is_active": False}})
    invalidate_salon(salon_id)  # remove from customer listings immediately
    log_event(
        salon_events_collection,
        salon_id=salon_id,
        actor_id=current_user.get("sub"),
        actor_role="admin",
        action="SALON_DEACTIVATED",
        field_changes={"is_active": {"before": True, "after": False}},
    )
    return {"status": "success", "message": "Salon deactivated"}


# ─── AI Service Recommendations (additive) ────────────────────────────────────

@router.post("/recommend-services")
async def recommend_services(
    analysis: dict,
    current_user: dict = Depends(get_current_user),
):
    """
    Given a skin analysis result, return salon services ranked by relevance.
    Matches skin concerns from the analysis against services across verified salons.
    """
    concerns   = analysis.get("concerns", [])
    skin_type  = analysis.get("skin_type", "")
    scores     = analysis.get("skin_scores", {})

    # Keyword map: concern → service keywords to look for
    CONCERN_KEYWORDS = {
        "acne":         ["facial", "acne", "peel", "cleanse", "extraction"],
        "pigmentation": ["brightening", "pigment", "vitamin c", "peel", "whitening"],
        "dryness":      ["hydration", "moisture", "hyaluronic", "nourish"],
        "oiliness":     ["oil control", "mattify", "pore", "clay"],
        "aging":        ["anti-aging", "collagen", "retinol", "firming", "lift"],
        "sensitivity":  ["soothing", "gentle", "calming", "sensitive"],
        "hair":         ["hair", "keratin", "colour", "color", "scalp"],
    }

    all_keywords: list = []
    for concern in concerns:
        for key, kws in CONCERN_KEYWORDS.items():
            if key in concern.lower():
                all_keywords.extend(kws)
    if not all_keywords:
        all_keywords = ["facial", "skin care", "beauty"]

    # Fetch verified, active salons with services
    salons = list(
        salons_collection.find(
            {"is_active": True},
            {"id": 1, "name": 1, "city": 1, "services_with_pricing": 1, "avg_rating": 1}
        ).limit(50)
    )

    recommendations = []
    seen = set()
    for salon in salons:
        for svc in salon.get("services_with_pricing", []):
            if not svc.get("is_active", True):
                continue
            svc_name_lower = svc.get("name", "").lower()
            svc_cat_lower  = svc.get("category", "").lower()
            score = sum(1 for kw in all_keywords if kw in svc_name_lower or kw in svc_cat_lower)
            if score > 0:
                key = f"{salon['id']}_{svc['name']}"
                if key not in seen:
                    seen.add(key)
                    recommendations.append({
                        "salon_id":    salon.get("id"),
                        "salon_name":  salon.get("name"),
                        "city":        salon.get("city"),
                        "avg_rating":  salon.get("avg_rating"),
                        "service":     svc.get("name"),
                        "price":       svc.get("price"),
                        "category":    svc.get("category"),
                        "match_score": score,
                    })

    recommendations.sort(key=lambda x: x["match_score"], reverse=True)
    return {
        "recommendations": recommendations[:20],
        "based_on": {"concerns": concerns, "skin_type": skin_type},
    }

# ─────────────────────────────────────────────────────────────────────────────
# GALLERY UPLOAD
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/upload-gallery")
async def upload_salon_gallery(
    images: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Uploads multiple images for a salon gallery and returns their URLs."""
    if current_user["role"] != "shop_owner":
        raise HTTPException(status_code=403, detail="Only shop owners can upload gallery images")
    
    upload_dir = "static/uploads/salons"
    os.makedirs(upload_dir, exist_ok=True)
    
    saved_urls = []
    for image in images:
        if not image.filename:
            continue
        # Only allow jpg, png, webp
        ext = image.filename.split('.')[-1].lower()
        if ext not in ['jpg', 'jpeg', 'png', 'webp']:
            continue
            
        filename = f"{uuid.uuid4().hex}_{image.filename.replace(' ', '_')}"
        file_path = os.path.join(upload_dir, filename)
        
        with open(file_path, "wb") as buffer:
            await validate_image_upload(image)
            content = await image.read()
            buffer.write(content)
            
        saved_urls.append(f"/{file_path.replace(chr(92), '/')}")
        
    if not saved_urls:
        raise HTTPException(status_code=400, detail="No valid images were uploaded")
        
    return {"gallery_urls": saved_urls}
