"""
salon_events.py — Append-only audit log for all salon/service mutations.
Additive module — does NOT modify any existing code.
"""
from datetime import datetime
from typing import Optional
import uuid


def log_event(
    salon_events_collection,
    salon_id: str,
    actor_id: str,
    actor_role: str,
    action: str,
    field_changes: Optional[dict] = None,
    before_snapshot: Optional[dict] = None,
    after_snapshot: Optional[dict] = None,
    ip_address: Optional[str] = None,
):
    """
    Insert an event record into salon_events collection.
    Non-blocking: any failure is silently swallowed so it never
    interrupts the main write pipeline.

    Actions:
      SALON_REGISTERED | SALON_UPDATED | SALON_DEACTIVATED | SALON_VERIFIED
      SERVICE_ADDED | SERVICE_UPDATED | SERVICE_TOGGLED | SERVICE_DELETED
      IMAGE_UPLOADED | HOURS_UPDATED
    """
    try:
        event = {
            "id":              str(uuid.uuid4()),
            "salon_id":        salon_id,
            "actor_id":        actor_id,
            "actor_role":      actor_role,
            "action":          action,
            "field_changes":   field_changes or {},
            "before_snapshot": before_snapshot or {},
            "after_snapshot":  after_snapshot or {},
            "ip_address":      ip_address,
            "timestamp":       datetime.utcnow(),
        }
        salon_events_collection.insert_one(event)
    except Exception:
        pass  # audit log failure is never fatal


def _diff(before: dict, after: dict) -> dict:
    """Return only the fields that changed between before and after."""
    changes = {}
    all_keys = set(before.keys()) | set(after.keys())
    for k in all_keys:
        b, a = before.get(k), after.get(k)
        if b != a:
            changes[k] = {"before": b, "after": a}
    return changes


def _slim(salon: dict) -> dict:
    """Return a lightweight snapshot of key salon fields for audit storage."""
    keys = [
        "id", "name", "city", "is_active", "is_verified",
        "services_with_pricing", "avg_service_price",
        "opening_time", "closing_time", "cover_image_url",
    ]
    return {k: salon.get(k) for k in keys if k in salon}
