import logging
_log = logging.getLogger("beauty_api.coupon")

"""
Coupon Management Routes — Salon Partner B2B + Customer B2C
Handles: create coupons, validate, redeem, analytics
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from app.mongodb.collections import (
    coupons_collection, salons_collection, users_collection
)
from app.auth.jwt_handler import get_current_user
import uuid

router = APIRouter(prefix="/api/coupons", tags=["Coupons"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class CouponCreate(BaseModel):
    code: str
    description: Optional[str] = None
    discount_type: str = "percentage"   # percentage | flat
    discount_value: float               # e.g., 20 = 20% or ₹200 flat
    min_booking_amount: float = 0.0
    max_discount_cap: Optional[float] = None
    valid_from: str                     # YYYY-MM-DD
    valid_until: str                    # YYYY-MM-DD
    max_uses: int = 100
    per_user_limit: int = 1
    applicable_services: List[str] = []  # empty = all services
    is_active: bool = True

    @validator("code")
    def code_uppercase(cls, v):
        return v.upper().strip()

    @validator("discount_value")
    def validate_discount(cls, v, values):
        if values.get("discount_type") == "percentage" and not (1 <= v <= 100):
            raise ValueError("Percentage discount must be between 1 and 100")
        if v <= 0:
            raise ValueError("Discount value must be positive")
        return v


class CouponValidate(BaseModel):
    code: str
    salon_id: str
    service_amount: float
    user_id: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_owner_salon(current_user: dict):
    salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")})
    if not salon:
        raise HTTPException(status_code=404, detail="No salon found for this account")
    return salon

def _strip(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc

def _calculate_discount(coupon: dict, amount: float) -> float:
    if coupon["discount_type"] == "percentage":
        discount = amount * (coupon["discount_value"] / 100)
        if coupon.get("max_discount_cap"):
            discount = min(discount, coupon["max_discount_cap"])
    else:
        discount = coupon["discount_value"]
    return round(min(discount, amount), 2)


# ── Owner — Manage Coupons ────────────────────────────────────────────────────

@router.get("/owner/list")
async def list_owner_coupons(current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)
    coupons = list(coupons_collection.find({"salon_id": salon["id"]}).sort("created_at", -1))
    return [_strip(c) for c in coupons]


@router.post("/owner/create")
async def create_coupon(coupon: CouponCreate, current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)
    # Check duplicate code within this salon
    if coupons_collection.find_one({"salon_id": salon["id"], "code": coupon.code}):
        raise HTTPException(status_code=400, detail=f"Coupon code '{coupon.code}' already exists for your salon")
    new_coupon = {
        "id": str(uuid.uuid4()),
        "salon_id": salon["id"],
        "salon_name": salon.get("name"),
        "used_count": 0,
        "used_by": [],          # list of user_ids who redeemed
        "created_by": current_user.get("sub"),
        "created_at": datetime.utcnow(),
        **coupon.dict()
    }
    coupons_collection.insert_one(new_coupon)
    new_coupon.pop("_id", None)
    return {"status": "success", "message": "Coupon created successfully", "data": new_coupon}


@router.patch("/owner/{coupon_id}/toggle")
async def toggle_coupon(coupon_id: str, current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)
    coupon = coupons_collection.find_one({"id": coupon_id, "salon_id": salon["id"]})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    new_status = not coupon.get("is_active", True)
    coupons_collection.update_one({"id": coupon_id}, {"$set": {"is_active": new_status}})
    return {"status": "success", "is_active": new_status}


@router.delete("/owner/{coupon_id}")
async def delete_coupon(coupon_id: str, current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)
    result = coupons_collection.delete_one({"id": coupon_id, "salon_id": salon["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return {"status": "success", "message": "Coupon deleted"}


@router.get("/owner/analytics")
async def coupon_analytics(current_user: dict = Depends(get_current_user)):
    """Coupon performance analytics."""
    salon = _get_owner_salon(current_user)
    coupons = list(coupons_collection.find({"salon_id": salon["id"]}))
    total_discount_given = 0.0
    for c in coupons:
        total_discount_given += c.get("total_discount_given", 0.0)
    top = sorted(coupons, key=lambda x: x.get("used_count", 0), reverse=True)[:5]
    return {
        "total_coupons": len(coupons),
        "active_coupons": sum(1 for c in coupons if c.get("is_active")),
        "total_redemptions": sum(c.get("used_count", 0) for c in coupons),
        "total_discount_given": round(total_discount_given, 2),
        "top_coupons": [{"code": c["code"], "used_count": c.get("used_count", 0)} for c in top]
    }


# ── Customer — Validate & Redeem ─────────────────────────────────────────────

@router.post("/validate")
async def validate_coupon(data: CouponValidate, current_user: dict = Depends(get_current_user)):
    """
    Validate a coupon before booking confirmation.
    Returns discount amount if valid.
    """
    code = data.code.upper().strip()
    coupon = coupons_collection.find_one({
        "code": code,
        "salon_id": data.salon_id,
        "is_active": True
    })
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid or expired coupon code")

    today = datetime.utcnow().strftime("%Y-%m-%d")
    if coupon.get("valid_from", "0000-00-00") > today:
        raise HTTPException(status_code=400, detail="Coupon is not active yet")
    if coupon.get("valid_until", "9999-99-99") < today:
        raise HTTPException(status_code=400, detail="Coupon has expired")

    user_id = current_user.get("sub")
    if user_id in coupon.get("used_by", []):
        per_limit = coupon.get("per_user_limit", 1)
        user_usage = coupon.get("used_by", []).count(user_id)
        if user_usage >= per_limit:
            raise HTTPException(status_code=400, detail="You have already used this coupon")

    if coupon.get("used_count", 0) >= coupon.get("max_uses", 100):
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")

    if data.service_amount < coupon.get("min_booking_amount", 0):
        raise HTTPException(
            status_code=400,
            detail=f"Minimum booking amount ₹{coupon['min_booking_amount']} required for this coupon"
        )

    discount = _calculate_discount(coupon, data.service_amount)
    final_amount = round(data.service_amount - discount, 2)

    return {
        "valid": True,
        "coupon_id": coupon["id"],
        "code": code,
        "description": coupon.get("description"),
        "discount_type": coupon["discount_type"],
        "discount_value": coupon["discount_value"],
        "discount_amount": discount,
        "original_amount": data.service_amount,
        "final_amount": final_amount,
        "message": f"✅ Coupon applied! You save ₹{discount:.0f}"
    }


@router.post("/redeem")
async def redeem_coupon(coupon_id: str, booking_amount: float, current_user: dict = Depends(get_current_user)):
    """
    Mark coupon as redeemed after successful booking.
    Called internally after payment confirmation.
    """
    user_id = current_user.get("sub")
    coupon = coupons_collection.find_one({"id": coupon_id})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    discount = _calculate_discount(coupon, booking_amount)
    coupons_collection.update_one(
        {"id": coupon_id},
        {
            "$inc": {"used_count": 1, "total_discount_given": discount},
            "$push": {"used_by": user_id},
            "$set": {"last_used_at": datetime.utcnow()}
        }
    )
    return {"status": "success", "discount_applied": discount}


# ── Public — List Available Coupons for a Salon ───────────────────────────────

@router.get("/salon/{salon_id}")
async def get_salon_coupons(salon_id: str):
    """Public endpoint — show available coupons for a salon."""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    coupons = list(coupons_collection.find({
        "salon_id": salon_id,
        "is_active": True,
        "valid_from": {"$lte": today},
        "valid_until": {"$gte": today}
    }))
    return [{
        "id": c["id"],
        "code": c["code"],
        "description": c.get("description"),
        "discount_type": c["discount_type"],
        "discount_value": c["discount_value"],
        "min_booking_amount": c.get("min_booking_amount", 0),
        "valid_until": c.get("valid_until"),
        "uses_remaining": max(0, c.get("max_uses", 100) - c.get("used_count", 0))
    } for c in coupons]
