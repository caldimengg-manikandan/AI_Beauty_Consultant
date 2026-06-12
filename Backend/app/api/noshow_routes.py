from fastapi import APIRouter, Depends, HTTPException
from app.auth.jwt_handler import get_current_user
from app.mongodb.client import db
from pydantic import BaseModel
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/api/appointments", tags=["No-Show Predictor"])

appointments_col = db["appointments"]


def _calculate_noshow_score(booking: dict) -> tuple[int, list[str]]:
    """
    Heuristic no-show risk scorer.
    Returns (score 0-100, list of risk factor labels).
    In production, replace with a trained ML model.
    """
    score = 0
    factors = []

    # Factor 1: First-time client (no history)
    client_email = booking.get("user_email") or booking.get("client_email", "")
    past_count = appointments_col.count_documents({
        "user_email": client_email,
        "status": "completed",
    }) if client_email else 0

    if past_count == 0:
        score += 30
        factors.append("First-time client")
    elif past_count < 3:
        score += 10

    # Factor 2: Time of day — early morning / late evening higher risk
    appt_str = booking.get("appointment_time", "")
    try:
        hour = int(appt_str.split(":")[0]) if ":" in appt_str else 12
        if hour < 9 or hour >= 19:
            score += 20
            factors.append("Early/late slot")
    except Exception:
        pass

    # Factor 3: Day of week — Mondays and Fridays have higher no-show
    try:
        appt_date = booking.get("appointment_date")
        if appt_date:
            if isinstance(appt_date, str):
                appt_date = datetime.fromisoformat(appt_date)
            if appt_date.weekday() in (0, 4):  # Monday=0, Friday=4
                score += 15
                factors.append("High no-show day")
    except Exception:
        pass

    # Factor 4: Past cancellations
    past_cancellations = appointments_col.count_documents({
        "user_email": client_email,
        "status": {"$in": ["cancelled", "no_show"]},
    }) if client_email else 0

    if past_cancellations >= 2:
        score += 25
        factors.append("Past cancellations")
    elif past_cancellations == 1:
        score += 10
        factors.append("1 past cancellation")

    # Factor 5: Booking made same day
    created = booking.get("created_at")
    appt_date = booking.get("appointment_date")
    if created and appt_date:
        try:
            if isinstance(created, str):
                created = datetime.fromisoformat(created)
            if isinstance(appt_date, str):
                appt_date = datetime.fromisoformat(appt_date)
            if (appt_date - created).days == 0:
                score += 10
                factors.append("Same-day booking")
        except Exception:
            pass

    return min(score, 100), factors


class ReminderRequest(BaseModel):
    booking_id: str
    channel: str  # "email" or "sms"


@router.get("/noshow-risk")
async def get_noshow_risk(current_user: dict = Depends(get_current_user)):
    """Return upcoming bookings with no-show risk scores."""
    role = current_user.get("role", "user")
    if role not in ("shop_owner", "admin"):
        raise HTTPException(status_code=403, detail="Shop owners only")

    shop_email = current_user.get("sub")
    now = datetime.utcnow()
    window_end = now + timedelta(days=7)

    # Fetch upcoming bookings for this shop
    raw = list(appointments_col.find({
        "shop_owner_email": shop_email,
        "status": {"$in": ["pending", "confirmed"]},
    }).limit(50))

    bookings = []
    for b in raw:
        score, factors = _calculate_noshow_score(b)
        bookings.append({
            "_id":              str(b["_id"]),
            "client_name":      b.get("client_name") or b.get("user_name", "Client"),
            "service":          b.get("service", ""),
            "appointment_time": b.get("appointment_time", ""),
            "appointment_date": str(b.get("appointment_date", "")),
            "noshow_score":     score,
            "risk_factors":     factors,
        })

    # Sort high risk first
    bookings.sort(key=lambda x: x["noshow_score"], reverse=True)

    high   = sum(1 for b in bookings if b["noshow_score"] >= 65)
    medium = sum(1 for b in bookings if 35 <= b["noshow_score"] < 65)
    low    = sum(1 for b in bookings if b["noshow_score"] < 35)

    return {
        "success": True,
        "bookings": bookings,
        "stats": {"high_risk": high, "medium_risk": medium, "low_risk": low},
    }


@router.post("/send-reminder")
async def send_reminder(req: ReminderRequest, current_user: dict = Depends(get_current_user)):
    """Trigger a reminder to a client (email or SMS)."""
    role = current_user.get("role", "user")
    if role not in ("shop_owner", "admin"):
        raise HTTPException(status_code=403, detail="Shop owners only")

    # In production, integrate with Twilio/SendGrid here.
    # For now, mark the booking as reminder_sent.
    from bson import ObjectId
    try:
        oid = ObjectId(req.booking_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid booking ID")

    appointments_col.update_one(
        {"_id": oid},
        {"$set": {f"reminder_{req.channel}_sent": True, "reminder_sent_at": datetime.utcnow()}}
    )
    return {"success": True, "message": f"Reminder sent via {req.channel}"}
