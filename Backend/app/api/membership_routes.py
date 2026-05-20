from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime, timedelta
import uuid

from app.auth.jwt_handler import get_current_user
from app.mongodb.collections import memberships_collection, user_subscriptions_collection
from pydantic import BaseModel

router = APIRouter(prefix="/api/memberships", tags=["Memberships & Subscriptions"])

class SubscribeRequest(BaseModel):
    plan_id: str
    payment_method: str = "card"

def seed_plans_if_empty():
    count = memberships_collection.count_documents({})
    if count == 0:
        default_plans = [
            {
                "id": "plan_unlimited_hair",
                "name": "Unlimited Haircuts",
                "type": "individual",
                "price_monthly": 1999,
                "features": ["Unlimited basic haircuts", "1 Free styling per month", "Priority booking"],
                "color_theme": "indigo",
                "is_active": True
            },
            {
                "id": "plan_couple_spa",
                "name": "Couple's Spa Premium",
                "type": "couple",
                "price_monthly": 4999,
                "features": ["2 Deep tissue massages", "Shared wallet balance", "Weekend priority access"],
                "color_theme": "rose",
                "is_active": True
            },
            {
                "id": "plan_family_wellness",
                "name": "Family Wellness Tier",
                "type": "family",
                "price_monthly": 7999,
                "features": ["Services for up to 4 members", "20% off retail products", "Free monthly facials"],
                "color_theme": "emerald",
                "is_active": True
            }
        ]
        memberships_collection.insert_many(default_plans)

@router.get("/plans")
async def get_membership_plans():
    seed_plans_if_empty()
    cursor = memberships_collection.find({"is_active": True})
    plans = list(cursor)
    for p in plans:
        p.pop("_id", None)
    return plans

@router.get("/my-plans")
async def get_my_subscriptions(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    cursor = user_subscriptions_collection.find({"user_id": user_id}).sort("created_at", -1)
    subs = list(cursor)
    for s in subs:
        s.pop("_id", None)
    return subs

@router.post("/subscribe")
async def subscribe_to_plan(req: SubscribeRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    
    plan = memberships_collection.find_one({"id": req.plan_id})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    # Check if user already has an active subscription to this plan
    existing = user_subscriptions_collection.find_one({
        "user_id": user_id, 
        "plan_id": req.plan_id,
        "status": "active"
    })
    if existing:
        raise HTTPException(status_code=400, detail="You already have an active subscription to this plan.")
        
    sub_id = str(uuid.uuid4())
    new_sub = {
        "id": sub_id,
        "user_id": user_id,
        "plan_id": plan["id"],
        "plan_name": plan["name"],
        "price_monthly": plan["price_monthly"],
        "status": "active",
        "billing_cycle": "monthly",
        "current_period_start": datetime.utcnow().isoformat(),
        "current_period_end": (datetime.utcnow() + timedelta(days=30)).isoformat(),
        "created_at": datetime.utcnow().isoformat(),
        "features": plan.get("features", []),
        "color_theme": plan.get("color_theme", "indigo")
    }
    
    user_subscriptions_collection.insert_one(new_sub)
    new_sub.pop("_id", None)
    return {"status": "success", "message": "Successfully subscribed!", "subscription": new_sub}

@router.post("/{sub_id}/cancel")
async def cancel_subscription(sub_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    
    sub = user_subscriptions_collection.find_one({"id": sub_id, "user_id": user_id})
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
        
    if sub.get("status") == "cancelled":
        raise HTTPException(status_code=400, detail="Subscription is already cancelled")
        
    user_subscriptions_collection.update_one(
        {"id": sub_id},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.utcnow().isoformat()}}
    )
    
    return {"status": "success", "message": "Subscription cancelled. You will have access until the end of the billing period."}
