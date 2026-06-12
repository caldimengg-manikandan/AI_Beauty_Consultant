from fastapi import APIRouter, Depends, HTTPException
from app.auth.jwt_handler import get_current_user
from app.mongodb.client import db
from bson import ObjectId

router = APIRouter(prefix="/api/passport", tags=["Beauty Passport"])

onboarding_col  = db["onboarding_profiles"]
appointments_col = db["appointments"]
analysis_col    = db["analysis_history"]


def _build_passport(profile: dict) -> dict:
    """Strip internal fields and build public passport dict."""
    if not profile:
        return {}
    exclude = {"_id", "user_email", "created_at", "updated_at"}
    return {k: v for k, v in profile.items() if k not in exclude and v}


@router.get("/me")
async def get_my_passport(current_user: dict = Depends(get_current_user)):
    """Return the current user's beauty passport."""
    email = current_user.get("sub")
    profile = onboarding_col.find_one({"user_email": email})
    passport = _build_passport(profile)

    # Enrich with scan stats
    total_scans = analysis_col.count_documents({"user_email": email})
    passport["total_scans"] = total_scans

    return {"success": True, "passport": passport}


@router.get("/client/{booking_id}")
async def get_client_passport(
    booking_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Shop owners call this to get a client's beauty passport from a booking.
    Only returns data if the booking belongs to the shop owner's shop.
    """
    role = current_user.get("role", "user")
    if role not in ("shop_owner", "admin"):
        raise HTTPException(status_code=403, detail="Shop owners only")

    # Find booking
    try:
        oid = ObjectId(booking_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid booking ID")

    booking = appointments_col.find_one({"_id": oid})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    client_email = booking.get("user_email") or booking.get("client_email")
    if not client_email:
        return {"success": True, "passport": None}

    profile = onboarding_col.find_one({"user_email": client_email})
    passport = _build_passport(profile)
    return {"success": True, "passport": passport}
