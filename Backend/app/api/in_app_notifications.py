"""
In-App Notifications API
Generates dynamic notifications from real collections (analyses, appointments, slot bookings).
Purely additive — does not touch any existing routes or collections.
"""
from fastapi import APIRouter, Depends, Query
from app.auth.jwt_handler import get_current_user
from app.mongodb.collections import (
    analysis_collection,
    appointments_collection,
    slot_bookings_collection,
)
from app.mongodb.client import db
from datetime import datetime, timezone
from typing import List

router = APIRouter(prefix="/api/notifications", tags=["In-App Notifications"])

# Lightweight collection for storing cleared-at timestamps (no migration needed)
_notif_prefs = db["notification_preferences"]

# ─── helpers ──────────────────────────────────────────────────────────────────

def _relative_time(dt: datetime) -> str:
    """Return a human-readable relative time string."""
    if dt is None:
        return "Recently"
    # ensure aware → naive comparison in UTC
    if dt.tzinfo is not None:
        dt = dt.replace(tzinfo=None)
    delta = datetime.utcnow() - dt
    secs = int(delta.total_seconds())
    if secs < 60:
        return "Just now"
    if secs < 3600:
        m = secs // 60
        return f"{m} minute{'s' if m > 1 else ''} ago"
    if secs < 86400:
        h = secs // 3600
        return f"{h} hour{'s' if h > 1 else ''} ago"
    d = secs // 86400
    return f"{d} day{'s' if d > 1 else ''} ago"


def _skin_headline(doc: dict) -> str:
    scores = doc.get("skin_scores", {})
    hydration = scores.get("hydration", 0)
    acne = scores.get("acne", 0)
    if isinstance(hydration, float) and hydration > 0.7:
        return "High radiance detected — your skin is thriving!"
    if isinstance(acne, float) and acne > 0.5:
        return "Elevated acne markers detected. Review your routine."
    face_shape = doc.get("face_shape", "")
    if face_shape:
        return f"Scan complete — {face_shape} face profile analysed."
    return "New AI skin analysis completed."


# ─── GET /api/notifications/in-app ───────────────────────────────────────────

@router.get("/in-app")
async def get_in_app_notifications(
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user.get("sub")          # email / JWT subject
    notifications: List[dict] = []

    # ── 1. Recent skin analyses ───────────────────────────────────────────────
    try:
        analyses = list(
            analysis_collection.find(
                {"user_email": user_id},
                {"skin_scores": 1, "face_shape": 1, "created_at": 1},
            )
            .sort("created_at", -1)
            .limit(3)
        )
        for doc in analyses:
            created = doc.get("created_at")
            notifications.append({
                "id":       str(doc.get("_id", "")),
                "type":     "scan",
                "icon":     "scan",
                "title":    "AI Skin Analysis",
                "message":  _skin_headline(doc),
                "time":     _relative_time(created),
                "created_at": created.isoformat() if created else None,
                "unread":   True,
            })
    except Exception:
        pass

    # ── 2. Appointments ───────────────────────────────────────────────────────
    try:
        appts = list(
            appointments_collection.find(
                {"user_id": user_id},
                {"service_name": 1, "appointment_date": 1,
                 "appointment_time": 1, "created_at": 1},
            )
            .sort("created_at", -1)
            .limit(3)
        )
        for doc in appts:
            created = doc.get("created_at")
            svc   = doc.get("service_name", "your appointment")
            date  = doc.get("appointment_date", "")
            time  = doc.get("appointment_time", "")
            notifications.append({
                "id":       str(doc.get("_id", "")),
                "type":     "appointment",
                "icon":     "appointment",
                "title":    "Appointment Booked",
                "message":  f"{svc} confirmed for {date} at {time}.".strip(" .") + ".",
                "time":     _relative_time(created),
                "created_at": created.isoformat() if created else None,
                "unread":   True,
            })
    except Exception:
        pass

    # ── 3. Salon slot bookings ────────────────────────────────────────────────
    try:
        bookings = list(
            slot_bookings_collection.find(
                {"user_id": user_id},
                {"service_name": 1, "salon_name": 1,
                 "appointment_date": 1, "appointment_time": 1,
                 "status": 1, "created_at": 1},
            )
            .sort("created_at", -1)
            .limit(3)
        )
        for doc in bookings:
            created = doc.get("created_at")
            svc    = doc.get("service_name", "Service")
            salon  = doc.get("salon_name", "")
            status = doc.get("status", "confirmed").capitalize()
            at_salon = f" at {salon}" if salon else ""
            notifications.append({
                "id":       str(doc.get("_id", "")),
                "type":     "booking",
                "icon":     "booking",
                "title":    f"Salon Booking {status}",
                "message":  f"{svc}{at_salon} — {status.lower()}.",
                "time":     _relative_time(created),
                "created_at": created.isoformat() if created else None,
                "unread":   True,
            })
    except Exception:
        pass

    # ── Filter items after the user's last "clear all" ────────────────────────
    try:
        pref = _notif_prefs.find_one({"user_email": user_id}, {"notifications_cleared_at": 1})
        cleared_at = pref.get("notifications_cleared_at") if pref else None
        if cleared_at:
            if cleared_at.tzinfo is not None:
                cleared_at = cleared_at.replace(tzinfo=None)
            def _after_clear(n):
                ca = n.get("created_at")
                if not ca:
                    return True
                try:
                    dt = datetime.fromisoformat(ca)
                    if dt.tzinfo is not None:
                        dt = dt.replace(tzinfo=None)
                    return dt > cleared_at
                except Exception:
                    return True
            notifications = [n for n in notifications if _after_clear(n)]
    except Exception:
        pass

    # ── Sort by recency, cap at limit ─────────────────────────────────────────
    def _sort_key(n):
        ca = n.get("created_at")
        try:
            return datetime.fromisoformat(ca) if ca else datetime.min
        except Exception:
            return datetime.min

    notifications.sort(key=_sort_key, reverse=True)
    notifications = notifications[:limit]

    # Strip internal created_at from response (frontend only needs time string)
    for n in notifications:
        n.pop("created_at", None)

    return {
        "notifications": notifications,
        "unread_count":  sum(1 for n in notifications if n.get("unread")),
        "total":         len(notifications),
    }


# ─── DELETE /api/notifications/in-app/clear ───────────────────────────────────

@router.delete("/in-app/clear")
async def clear_in_app_notifications(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    _notif_prefs.update_one(
        {"user_email": user_id},
        {"$set": {"notifications_cleared_at": datetime.utcnow()}},
        upsert=True,
    )
    return {"status": "success", "message": "All notifications cleared."}
