import logging
_log = logging.getLogger("beauty_api.salon_service")

"""
salon_service_routes.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADDITIVE module — NEW endpoints only.
Does NOT modify, override, or shadow any route in salon_routes.py.
All endpoints live under the prefix  /api/salon-services
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Shop Owner Service Management endpoints:
  POST   /api/salon-services/owner/services               — add new service
  PUT    /api/salon-services/owner/services/{name}        — update service fields
  PATCH  /api/salon-services/owner/services/{name}/toggle — activate / deactivate
  DELETE /api/salon-services/owner/services/{name}        — soft-delete (is_active=False)
  PUT    /api/salon-services/owner/hours                  — update business hours
  POST   /api/salon-services/owner/upload-cover           — update cover image URL
  GET    /api/salon-services/owner/audit-trail            — view event history (owner)
  GET    /api/salon-services/admin/audit-trail/{salon_id} — view event history (admin)
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from datetime import datetime

from app.schemas.salon import SalonServiceAdd, SalonServiceUpdate, SalonHoursUpdate
from app.mongodb.collections import (
    salons_collection,
    salon_events_collection,
    slot_bookings_collection,
)
from app.auth.jwt_handler import get_current_user
from app.utils.salon_cache import invalidate_salon
from app.utils.salon_events import log_event, _slim, _diff
from app.utils.avg_price import compute_avg_service_price
from app.utils.db_retry import retry_write
from app.utils.sanitize import sanitize_text

router = APIRouter(prefix="/api/salon-services", tags=["Salon Service Management"])

MAX_SERVICES = 50  # Hard cap per salon

VALID_CATEGORIES = {"Hair", "Skin", "Spa", "Makeup", "Nail", "General"}


# ─────────────────────────────────────────────────────────────────────────────
# INTERNAL HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _strip_id(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


def _get_owner_salon(current_user: dict) -> dict:
    """Return the salon belonging to the calling shop_owner or raise 404."""
    salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")})
    if not salon:
        raise HTTPException(status_code=404, detail="No salon found for this account")
    return salon


def _find_service(services: list, name: str) -> int:
    """Return the index of a service by name (case-insensitive), or -1."""
    name_lower = name.strip().lower()
    for i, s in enumerate(services):
        if s.get("name", "").strip().lower() == name_lower:
            return i
    return -1


def _validate_service_fields(name: str = None, price: float = None,
                              duration_mins: int = None, category: str = None):
    if name is not None:
        name = name.strip()
        if len(name) < 2 or len(name) > 100:
            raise HTTPException(status_code=422, detail="Service name must be 2–100 characters")
    if price is not None:
        if price < 0 or price > 999_999:
            raise HTTPException(status_code=422, detail="Price must be between 0 and 999,999")
    if duration_mins is not None:
        if not (1 <= duration_mins <= 480):
            raise HTTPException(status_code=422, detail="Duration must be between 1 and 480 minutes")
    if category is not None:
        if category not in VALID_CATEGORIES:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid category. Must be one of: {', '.join(sorted(VALID_CATEGORIES))}"
            )


def _get_ip(request: Request) -> str:
    return (request.headers.get("x-forwarded-for") or "").split(",")[0].strip() \
           or str(request.client.host) if request.client else "unknown"


# ─────────────────────────────────────────────────────────────────────────────
# ADD SERVICE
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/owner/services")
async def add_service(
    service: SalonServiceAdd,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Add a new service to the calling owner's salon."""
    salon = _get_owner_salon(current_user)
    services: list = salon.get("services_with_pricing", [])

    # Validate + sanitize inputs
    _validate_service_fields(
        name=service.name,
        price=service.price,
        duration_mins=service.duration_mins,
        category=service.category,
    )
    sanitize_text(service.name, "name")
    if service.description:
        sanitize_text(service.description, "description")

    # Duplicate check (case-insensitive)
    if _find_service(services, service.name) != -1:
        raise HTTPException(
            status_code=400,
            detail=f"A service named '{service.name}' already exists in your salon."
        )

    # Max services cap
    active_count = sum(1 for s in services if s.get("is_active", True))
    if active_count >= MAX_SERVICES:
        raise HTTPException(
            status_code=400,
            detail=f"Service limit reached (max {MAX_SERVICES} active services). "
                   "Please deactivate or delete a service before adding a new one."
        )

    # Build new service entry
    new_service = {
        "name":         service.name.strip().title(),
        "price":        round(float(service.price), 2),
        "duration_mins": service.duration_mins,
        "category":     service.category,
        "is_active":    True,
        "image_url":    service.image_url,
        "description":  service.description,
        "added_at":     datetime.utcnow(),
    }

    new_services = services + [new_service]
    new_avg = compute_avg_service_price(new_services)

    before = _slim(salon)

    retry_write(salons_collection.update_one,
        {"owner_user_id": current_user.get("sub")},
        {"$set": {
            "services_with_pricing": new_services,
            "avg_service_price":     new_avg,
            "updated_at":            datetime.utcnow(),
        }}
    )

    after_salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")}) or {}
    after = _slim(after_salon)

    # Side effects (non-blocking)
    invalidate_salon(salon["id"], salon.get("city"))
    log_event(
        salon_events_collection,
        salon_id=salon["id"],
        actor_id=current_user.get("sub"),
        actor_role=current_user.get("role", "shop_owner"),
        action="SERVICE_ADDED",
        field_changes={"services_with_pricing": {"added": new_service}},
        before_snapshot=before,
        after_snapshot=after,
        ip_address=_get_ip(request),
    )

    return {
        "status":  "success",
        "message": f"Service '{new_service['name']}' added successfully.",
        "data":    new_service,
        "avg_service_price": new_avg,
    }


# ─────────────────────────────────────────────────────────────────────────────
# UPDATE SERVICE
# ─────────────────────────────────────────────────────────────────────────────

@router.put("/owner/services/{service_name}")
async def update_service(
    service_name: str,
    updates: SalonServiceUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Update fields on an existing service."""
    salon = _get_owner_salon(current_user)
    services: list = list(salon.get("services_with_pricing", []))

    idx = _find_service(services, service_name)
    if idx == -1:
        raise HTTPException(status_code=404, detail=f"Service '{service_name}' not found")

    update_dict = {k: v for k, v in updates.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Validate + sanitize supplied fields
    _validate_service_fields(
        name=update_dict.get("name"),
        price=update_dict.get("price"),
        duration_mins=update_dict.get("duration_mins"),
        category=update_dict.get("category"),
    )
    if "name" in update_dict:
        sanitize_text(update_dict["name"], "name")
    if "description" in update_dict and update_dict["description"]:
        sanitize_text(update_dict["description"], "description")

    # If renaming, check the new name isn't a duplicate
    if "name" in update_dict:
        new_name = update_dict["name"].strip()
        dup_idx = _find_service(services, new_name)
        if dup_idx != -1 and dup_idx != idx:
            raise HTTPException(
                status_code=400,
                detail=f"A service named '{new_name}' already exists."
            )
        update_dict["name"] = new_name.title()

    if "price" in update_dict:
        update_dict["price"] = round(float(update_dict["price"]), 2)

    # Apply updates to the service entry
    old_service = dict(services[idx])
    services[idx] = {**services[idx], **update_dict, "updated_at": datetime.utcnow()}
    new_avg = compute_avg_service_price(services)

    before = _slim(salon)

    retry_write(salons_collection.update_one,
        {"owner_user_id": current_user.get("sub")},
        {"$set": {
            "services_with_pricing": services,
            "avg_service_price":     new_avg,
            "updated_at":            datetime.utcnow(),
        }}
    )

    after_salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")}) or {}

    invalidate_salon(salon["id"], salon.get("city"))
    log_event(
        salon_events_collection,
        salon_id=salon["id"],
        actor_id=current_user.get("sub"),
        actor_role=current_user.get("role", "shop_owner"),
        action="SERVICE_UPDATED",
        field_changes=_diff(old_service, services[idx]),
        before_snapshot=before,
        after_snapshot=_slim(after_salon),
        ip_address=_get_ip(request),
    )

    return {
        "status":  "success",
        "message": f"Service updated successfully.",
        "data":    services[idx],
        "avg_service_price": new_avg,
    }


# ─────────────────────────────────────────────────────────────────────────────
# TOGGLE SERVICE (activate / deactivate)
# ─────────────────────────────────────────────────────────────────────────────

@router.patch("/owner/services/{service_name}/toggle")
async def toggle_service(
    service_name: str,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Flip the is_active flag on a service. No data is deleted."""
    salon = _get_owner_salon(current_user)
    services: list = list(salon.get("services_with_pricing", []))

    idx = _find_service(services, service_name)
    if idx == -1:
        raise HTTPException(status_code=404, detail=f"Service '{service_name}' not found")

    old_active = services[idx].get("is_active", True)
    new_active = not old_active
    services[idx] = {**services[idx], "is_active": new_active, "updated_at": datetime.utcnow()}
    new_avg = compute_avg_service_price(services)

    before = _slim(salon)

    retry_write(salons_collection.update_one,
        {"owner_user_id": current_user.get("sub")},
        {"$set": {
            "services_with_pricing": services,
            "avg_service_price":     new_avg,
            "updated_at":            datetime.utcnow(),
        }}
    )

    after_salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")}) or {}

    invalidate_salon(salon["id"], salon.get("city"))
    log_event(
        salon_events_collection,
        salon_id=salon["id"],
        actor_id=current_user.get("sub"),
        actor_role=current_user.get("role", "shop_owner"),
        action="SERVICE_TOGGLED",
        field_changes={"is_active": {"before": old_active, "after": new_active}},
        before_snapshot=before,
        after_snapshot=_slim(after_salon),
        ip_address=_get_ip(request),
    )

    action_label = "activated" if new_active else "deactivated"
    return {
        "status":    "success",
        "message":   f"Service '{services[idx]['name']}' {action_label}.",
        "is_active": new_active,
        "avg_service_price": new_avg,
    }


# ─────────────────────────────────────────────────────────────────────────────
# SOFT-DELETE SERVICE
# ─────────────────────────────────────────────────────────────────────────────

@router.delete("/owner/services/{service_name}")
async def delete_service(
    service_name: str,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """
    Soft-delete: sets is_active=False on the named service.
    Hard deletes are blocked to protect booking history integrity.
    """
    salon = _get_owner_salon(current_user)
    services: list = list(salon.get("services_with_pricing", []))

    idx = _find_service(services, service_name)
    if idx == -1:
        raise HTTPException(status_code=404, detail=f"Service '{service_name}' not found")

    old_service = dict(services[idx])

    # ── Booking guard: warn but do NOT block if active bookings exist ─────────
    # The architecture soft-deletes (is_active=False) so existing booking records
    # are never orphaned. We surface a warning count so the owner is informed.
    active_booking_count = slot_bookings_collection.count_documents({
        "salon_id":    salon["id"],
        "service_name": {"$regex": f"^{re.escape(old_service['name'])}$", "$options": "i"},
        "status":      {"$in": ["confirmed", "pending"]},
    })

    services[idx] = {
        **services[idx],
        "is_active":      False,
        "deactivated_at": datetime.utcnow(),
        "updated_at":     datetime.utcnow(),
    }
    new_avg = compute_avg_service_price(services)

    before = _slim(salon)

    retry_write(salons_collection.update_one,
        {"owner_user_id": current_user.get("sub")},
        {"$set": {
            "services_with_pricing": services,
            "avg_service_price":     new_avg,
            "updated_at":            datetime.utcnow(),
        }}
    )

    after_salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")}) or {}

    invalidate_salon(salon["id"], salon.get("city"))
    log_event(
        salon_events_collection,
        salon_id=salon["id"],
        actor_id=current_user.get("sub"),
        actor_role=current_user.get("role", "shop_owner"),
        action="SERVICE_DELETED",
        field_changes=_diff(old_service, services[idx]),
        before_snapshot=before,
        after_snapshot=_slim(after_salon),
        ip_address=_get_ip(request),
    )

    warning = (
        f" Note: {active_booking_count} active booking(s) reference this service. "
        "Those bookings are preserved and unaffected."
        if active_booking_count > 0 else ""
    )
    return {
        "status":  "success",
        "message": f"Service '{old_service['name']}' deactivated (soft-deleted).{warning}",
        "active_bookings_warned": active_booking_count,
        "avg_service_price": new_avg,
    }


# ─────────────────────────────────────────────────────────────────────────────
# UPDATE BUSINESS HOURS
# ─────────────────────────────────────────────────────────────────────────────

@router.put("/owner/hours")
async def update_hours(
    hours: SalonHoursUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Atomically update business hours and slot configuration."""
    from datetime import datetime as _dt

    # Validate time format and logical order
    try:
        open_dt  = _dt.strptime(hours.opening_time,  "%I:%M %p")
        close_dt = _dt.strptime(hours.closing_time,  "%I:%M %p")
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail="Invalid time format. Use HH:MM AM/PM (e.g. '9:00 AM', '08:30 PM')"
        )
    if open_dt >= close_dt:
        raise HTTPException(
            status_code=422,
            detail="opening_time must be earlier than closing_time"
        )

    if hours.slot_duration_minutes is not None:
        if not (1 <= hours.slot_duration_minutes <= 480):
            raise HTTPException(status_code=422, detail="slot_duration_minutes must be 1–480")

    if hours.max_concurrent_slots is not None:
        if not (1 <= hours.max_concurrent_slots <= 20):
            raise HTTPException(status_code=422, detail="max_concurrent_slots must be 1–20")

    salon = _get_owner_salon(current_user)
    before = _slim(salon)

    update_fields: dict = {
        "opening_time": hours.opening_time,
        "closing_time": hours.closing_time,
        "updated_at":   _dt.utcnow(),
    }
    if hours.slot_duration_minutes is not None:
        update_fields["slot_duration_minutes"] = hours.slot_duration_minutes
    if hours.max_concurrent_slots is not None:
        update_fields["max_concurrent_slots"] = hours.max_concurrent_slots

    retry_write(salons_collection.update_one,
        {"owner_user_id": current_user.get("sub")},
        {"$set": update_fields}
    )

    after_salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")}) or {}

    invalidate_salon(salon["id"], salon.get("city"))
    log_event(
        salon_events_collection,
        salon_id=salon["id"],
        actor_id=current_user.get("sub"),
        actor_role=current_user.get("role", "shop_owner"),
        action="HOURS_UPDATED",
        field_changes=_diff(before, _slim(after_salon)),
        before_snapshot=before,
        after_snapshot=_slim(after_salon),
        ip_address=_get_ip(request),
    )

    return {
        "status":  "success",
        "message": "Business hours updated. Slot availability reflects the new schedule immediately.",
        "data":    {k: update_fields[k] for k in update_fields if k != "updated_at"},
    }


# ─────────────────────────────────────────────────────────────────────────────
# UPDATE COVER IMAGE URL
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/owner/upload-cover")
async def update_cover_image(
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """
    Update the salon cover image URL.
    Accepts JSON body: { "cover_image_url": "https://..." }
    """
    body = await request.json()
    image_url = body.get("cover_image_url", "").strip()

    if not image_url:
        raise HTTPException(status_code=422, detail="cover_image_url is required")
    if not image_url.startswith(("http://", "https://")):
        raise HTTPException(status_code=422, detail="cover_image_url must start with http:// or https://")

    salon = _get_owner_salon(current_user)
    before = _slim(salon)

    retry_write(salons_collection.update_one,
        {"owner_user_id": current_user.get("sub")},
        {"$set": {"cover_image_url": image_url, "updated_at": datetime.utcnow()}}
    )

    after_salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")}) or {}

    invalidate_salon(salon["id"], salon.get("city"))
    log_event(
        salon_events_collection,
        salon_id=salon["id"],
        actor_id=current_user.get("sub"),
        actor_role=current_user.get("role", "shop_owner"),
        action="IMAGE_UPLOADED",
        field_changes={"cover_image_url": {"before": before.get("cover_image_url"), "after": image_url}},
        before_snapshot=before,
        after_snapshot=_slim(after_salon),
        ip_address=_get_ip(request),
    )

    return {
        "status":  "success",
        "message": "Cover image updated. Customers will see the new image on their next load.",
        "cover_image_url": image_url,
    }


# ─────────────────────────────────────────────────────────────────────────────
# UPDATE PER-SERVICE IMAGE URL
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/owner/services/{service_name}/upload-image")
async def update_service_image(
    service_name: str,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Update the image URL for a specific service."""
    body = await request.json()
    image_url = body.get("image_url", "").strip()

    if not image_url:
        raise HTTPException(status_code=422, detail="image_url is required")
    if not image_url.startswith(("http://", "https://")):
        raise HTTPException(status_code=422, detail="image_url must start with http:// or https://")

    salon = _get_owner_salon(current_user)
    services: list = list(salon.get("services_with_pricing", []))

    idx = _find_service(services, service_name)
    if idx == -1:
        raise HTTPException(status_code=404, detail=f"Service '{service_name}' not found")

    services[idx] = {**services[idx], "image_url": image_url, "updated_at": datetime.utcnow()}

    retry_write(salons_collection.update_one,
        {"owner_user_id": current_user.get("sub")},
        {"$set": {"services_with_pricing": services, "updated_at": datetime.utcnow()}}
    )

    invalidate_salon(salon["id"], salon.get("city"))
    log_event(
        salon_events_collection,
        salon_id=salon["id"],
        actor_id=current_user.get("sub"),
        actor_role=current_user.get("role", "shop_owner"),
        action="IMAGE_UPLOADED",
        field_changes={"service_image": {"service": service_name, "image_url": image_url}},
        ip_address=_get_ip(request),
    )

    return {
        "status":  "success",
        "message": f"Image updated for service '{services[idx]['name']}'.",
        "image_url": image_url,
    }


# ─────────────────────────────────────────────────────────────────────────────
# AUDIT TRAIL — Owner view (own salon only)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/owner/audit-trail")
async def get_owner_audit_trail(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(50, le=200),
    action: str = Query(None, description="Filter by action type"),
):
    """Return the most recent audit events for the calling owner's salon."""
    salon = _get_owner_salon(current_user)
    query: dict = {"salon_id": salon["id"]}
    if action:
        query["action"] = action

    events = list(
        salon_events_collection.find(query)
        .sort("timestamp", -1)
        .limit(limit)
    )
    return [_strip_id(e) for e in events]


# ─────────────────────────────────────────────────────────────────────────────
# AUDIT TRAIL — Admin view (any salon)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/admin/audit-trail/{salon_id}")
async def get_admin_audit_trail(
    salon_id: str,
    current_user: dict = Depends(get_current_user),
    limit: int = Query(100, le=500),
    action: str = Query(None),
):
    """Return full audit trail for any salon — admin only."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    query: dict = {"salon_id": salon_id}
    if action:
        query["action"] = action

    events = list(
        salon_events_collection.find(query)
        .sort("timestamp", -1)
        .limit(limit)
    )
    return [_strip_id(e) for e in events]


# ─────────────────────────────────────────────────────────────────────────────
# CUSTOMER — list active services for a salon
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/customer/{salon_id}/services")
async def get_salon_services(
    salon_id: str,
    category: str = Query(None, description="Filter by category"),
    current_user: dict = Depends(get_current_user),
):
    """
    Return only the ACTIVE services for a salon.
    Customers always see the latest committed state.
    """
    salon = salons_collection.find_one({"id": salon_id})
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    services = salon.get("services_with_pricing", [])
    # Filter: active only for customer view
    active = [s for s in services if s.get("is_active", True)]

    if category:
        active = [s for s in active if s.get("category", "").lower() == category.lower()]

    return {
        "salon_id":   salon_id,
        "salon_name": salon.get("name"),
        "services":   active,
        "total":      len(active),
    }


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC — list ALL active services across ALL registered salons
# Used by the Spa Services page to display real catalogue data
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/public/all")
async def get_all_public_services(
    category: str = Query(None, description="Filter by service category"),
    gender: str   = Query(None, description="Filter by salon gender_served: Female | Male | Unisex"),
    search: str   = Query(None, description="Search by service or parlour name"),
    skip: int     = Query(0, ge=0),
    limit: int    = Query(100, ge=1, le=500),
):
    """
    Returns all active services across every registered, active salon.
    Each service item includes parlour_name, parlour_id, and salon metadata.
    No authentication required — public catalogue endpoint.
    """
    # Fetch all active salons
    salon_query: dict = {"is_active": True}
    if gender and gender.lower() != "all":
        # Match Female, Male, or Unisex (Unisex shows in both)
        salon_query["$or"] = [
            {"gender_served": gender},
            {"gender_served": "Unisex"},
        ]

    salons = list(salons_collection.find(salon_query))

    # Flatten: one record per service, enriched with parlour info
    flat: list = []
    seen: set  = set()   # deduplicate by (salon_id, service_name)

    for salon in salons:
        salon_id   = salon.get("id", "")
        salon_name = salon.get("name", "Unknown Parlour")
        salon_gender = salon.get("gender_served", "Unisex")
        salon_city   = salon.get("city", "")
        salon_phone  = salon.get("phone", "")
        salon_rating = salon.get("avg_rating", 0.0)

        for svc in salon.get("services_with_pricing", []):
            if not svc.get("is_active", True):
                continue  # skip deactivated services

            key = (salon_id, svc.get("name", "").lower())
            if key in seen:
                continue
            seen.add(key)

            # Optional filters
            if category:
                if svc.get("category", "").lower() != category.lower():
                    continue
            if search:
                q = search.lower()
                if (
                    q not in svc.get("name", "").lower()
                    and q not in salon_name.lower()
                    and q not in (svc.get("description") or "").lower()
                ):
                    continue

            flat.append({
                "service_name":  svc.get("name", ""),
                "description":   svc.get("description") or "",
                "price":         svc.get("price", 0),
                "duration_mins": svc.get("duration_mins", 0),
                "category":      svc.get("category", "General"),
                "image_url":     svc.get("image_url") or "",
                "rating":        svc.get("rating", salon_rating),
                "is_active":     svc.get("is_active", True),
                # Parlour identity
                "parlour_id":    salon_id,
                "parlour_name":  salon_name,
                "parlour_city":  salon_city,
                "parlour_phone": salon_phone,
                "parlour_gender": salon_gender,
            })

    total = len(flat)
    paginated = flat[skip: skip + limit]

    return {
        "total":    total,
        "skip":     skip,
        "limit":    limit,
        "services": paginated,
    }

