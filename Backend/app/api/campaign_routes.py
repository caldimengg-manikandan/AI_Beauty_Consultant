"""
Marketing Campaign Routes — Salon Partner B2B
Handles: push campaigns, geo-targeted offers, promotional notifications
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.mongodb.collections import (
    campaigns_collection, salons_collection, users_collection, slot_bookings_collection, automations_collection, coupons_collection
)
from app.auth.jwt_handler import get_current_user
from app.auth.rbac import require_shop_owner
import uuid

router = APIRouter(
    prefix="/api/campaigns",
    tags=["Marketing Campaigns"],
    dependencies=[__import__('fastapi').Depends(require_shop_owner)]
)


# ── Schemas ───────────────────────────────────────────────────────────────────

class CampaignCreate(BaseModel):
    title: str
    message: str
    campaign_type: str = "promotional"   # promotional | loyalty | re_engagement | seasonal
    target_audience: str = "all"         # all | new | returning | inactive | vip
    min_visits: Optional[int] = None     # target users with >= N visits
    max_visits: Optional[int] = None     # target users with <= N visits
    offer_code: Optional[str] = None     # optional linked coupon
    offer_discount: Optional[str] = None # "20% off on all services this weekend"
    valid_until: Optional[str] = None    # YYYY-MM-DD
    send_whatsapp: bool = False
    send_email: bool = True
    send_push: bool = True
    scheduled_at: Optional[str] = None  # ISO datetime, None = send immediately

class CampaignUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    status: Optional[str] = None   # draft | scheduled | sent | cancelled
    scheduled_at: Optional[str] = None

class AIGenerateRequest(BaseModel):
    intent: str # birthday | reactivation | festival | discount
    audience: str
    tone: str = "friendly"
    discount_amount: Optional[str] = None

class AutomationCreate(BaseModel):
    name: str
    trigger_type: str # birthday | inactive_30_days | abandoned_cart
    message_template: str
    is_active: bool = True


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_owner_salon(current_user: dict):
    salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")})
    if not salon:
        raise HTTPException(status_code=404, detail="No salon found for this account")
    return salon

def _strip(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc

def _get_target_users(salon_id: str, target_audience: str,
                      min_visits: Optional[int], max_visits: Optional[int]) -> List[str]:
    """Determine which users match this campaign's audience."""
    all_bookings = list(slot_bookings_collection.find({"salon_id": salon_id, "status": "completed"}))
    user_visit_count: dict = {}
    for b in all_bookings:
        uid = b.get("user_id")
        if uid:
            user_visit_count[uid] = user_visit_count.get(uid, 0) + 1

    if target_audience == "all":
        users = list(user_visit_count.keys())
    elif target_audience == "new":
        users = [u for u, c in user_visit_count.items() if c == 1]
    elif target_audience == "returning":
        users = [u for u, c in user_visit_count.items() if c >= 2]
    elif target_audience == "vip":
        users = [u for u, c in user_visit_count.items() if c >= 5]
    elif target_audience == "inactive":
        # Users who visited > 30 days ago and haven't been back
        from datetime import timedelta
        cutoff = datetime.utcnow() - timedelta(days=30)
        recent_users = set(
            b.get("user_id") for b in slot_bookings_collection.find({
                "salon_id": salon_id,
                "status": "completed",
                "created_at": {"$gte": cutoff}
            })
        )
        users = [u for u in user_visit_count.keys() if u not in recent_users]
    else:
        users = list(user_visit_count.keys())

    if min_visits is not None:
        users = [u for u in users if user_visit_count.get(u, 0) >= min_visits]
    if max_visits is not None:
        users = [u for u in users if user_visit_count.get(u, 0) <= max_visits]

    return users


# ── Campaign CRUD ─────────────────────────────────────────────────────────────

@router.get("/")
async def list_campaigns(
    status: str = Query(None),
    current_user: dict = Depends(get_current_user)
):
    salon = _get_owner_salon(current_user)
    query: dict = {"salon_id": salon["id"]}
    if status:
        query["status"] = status
    campaigns = list(campaigns_collection.find(query).sort("created_at", -1))
    return [_strip(c) for c in campaigns]


@router.post("/create")
async def create_campaign(campaign: CampaignCreate, current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)

    # Estimate reach
    target_users = _get_target_users(
        salon["id"], campaign.target_audience,
        campaign.min_visits, campaign.max_visits
    )

    status = "scheduled" if campaign.scheduled_at else "draft"
    new_campaign = {
        "id": str(uuid.uuid4()),
        "salon_id": salon["id"],
        "salon_name": salon.get("name"),
        "status": status,
        "estimated_reach": len(target_users),
        "sent_count": 0,
        "opened_count": 0,
        "converted_count": 0,   # users who booked after campaign
        "created_by": current_user.get("sub"),
        "created_at": datetime.utcnow(),
        **campaign.dict()
    }
    campaigns_collection.insert_one(new_campaign)
    new_campaign.pop("_id", None)
    return {
        "status": "success",
        "message": f"Campaign created. Estimated reach: {len(target_users)} customers.",
        "data": new_campaign
    }


@router.put("/{campaign_id}")
async def update_campaign(campaign_id: str, updates: CampaignUpdate, current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = campaigns_collection.update_one(
        {"id": campaign_id, "salon_id": salon["id"]},
        {"$set": {**update_data, "updated_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"status": "success", "message": "Campaign updated"}


@router.post("/{campaign_id}/send")
async def send_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    """Mark campaign as sent and record dispatch (actual push/email handled externally)."""
    salon = _get_owner_salon(current_user)
    campaign = campaigns_collection.find_one({"id": campaign_id, "salon_id": salon["id"]})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.get("status") == "sent":
        raise HTTPException(status_code=400, detail="Campaign already sent")

    target_users = _get_target_users(
        salon["id"],
        campaign.get("target_audience", "all"),
        campaign.get("min_visits"),
        campaign.get("max_visits")
    )

    campaigns_collection.update_one(
        {"id": campaign_id},
        {"$set": {
            "status": "sent",
            "sent_at": datetime.utcnow(),
            "sent_count": len(target_users),
            "target_user_ids": target_users
        }}
    )
    return {
        "status": "success",
        "message": f"Campaign dispatched to {len(target_users)} customers",
        "reach": len(target_users)
    }


@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)
    result = campaigns_collection.delete_one({"id": campaign_id, "salon_id": salon["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"status": "success", "message": "Campaign deleted"}


# ── Analytics ─────────────────────────────────────────────────────────────────

@router.get("/analytics/overview")
async def campaign_analytics(current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)
    campaigns = list(campaigns_collection.find({"salon_id": salon["id"]}))
    sent = [c for c in campaigns if c.get("status") == "sent"]
    total_reach    = sum(c.get("sent_count", 0) for c in sent)
    total_converts = sum(c.get("converted_count", 0) for c in sent)
    return {
        "total_campaigns": len(campaigns),
        "sent_campaigns": len(sent),
        "draft_campaigns": sum(1 for c in campaigns if c.get("status") == "draft"),
        "total_reach": total_reach,
        "total_conversions": total_converts,
        "avg_conversion_rate": round((total_converts / total_reach * 100) if total_reach else 0, 1),
        "top_campaign": max(sent, key=lambda x: x.get("converted_count", 0), default={}).get("title", "N/A") if sent else "N/A"
    }

# ── AI Generation & Automations ───────────────────────────────────────────────

@router.post("/ai-generate")
async def generate_ai_copy(req: AIGenerateRequest, current_user: dict = Depends(get_current_user)):
    """Generates high-converting marketing copy using AI patterns."""
    import random
    
    tone_prefixes = {
        "friendly": "Hey there! 👋",
        "luxury": "Experience elegance.",
        "urgent": "Flash Sale Alert! ⚡"
    }
    
    prefix = tone_prefixes.get(req.tone, tone_prefixes["friendly"])
    discount = f" Enjoy {req.discount_amount} off!" if req.discount_amount else ""
    
    templates = {
        "birthday": [
            f"{prefix} Happy Birthday month! Treat yourself to a relaxing salon day.{discount} Book now!",
            f"{prefix} It's your special day soon! Let us pamper you.{discount} Tap to claim your gift."
        ],
        "reactivation": [
            f"{prefix} We miss you! It's been a while since your last visit.{discount} Come back and glow!",
            f"{prefix} It's time for a refresh! Your favorite stylists are waiting.{discount}"
        ],
        "festival": [
            f"{prefix} Get festival-ready with our exclusive grooming packages.{discount} Slots filling fast!",
            f"{prefix} Shine bright this season! Special festive offers available now.{discount}"
        ],
        "discount": [
            f"{prefix} Exclusive offer just for you!{discount} Valid for the next 48 hours.",
            f"{prefix} Flash Deal! Grab your favorite service at a steal.{discount} Book instantly!"
        ]
    }
    
    options = templates.get(req.intent, templates["discount"])
    selected_message = random.choice(options)
    
    return {
        "generated_message": selected_message,
        "suggested_title": f"{req.intent.capitalize()} Campaign"
    }

@router.get("/automations")
async def get_automations(current_user: dict = Depends(get_current_user)):
    """Fetch dynamic marketing automations from MongoDB."""
    salon = _get_owner_salon(current_user)
    salon_id = salon["id"]
    
    # Fetch from database
    cursor = automations_collection.find({"salon_id": salon_id})
    autos = list(cursor)
    
    # If none exist, seed the defaults for this salon
    if not autos:
        default_autos = [
            {
                "id": str(uuid.uuid4()),
                "salon_id": salon_id,
                "name": "Birthday Surprises",
                "trigger_type": "birthday_ml",
                "message_template": "Happy Birthday month! Get 20% off your next visit.",
                "is_active": True,
                "metrics": {"triggered": 0, "converted": 0}
            },
            {
                "id": str(uuid.uuid4()),
                "salon_id": salon_id,
                "name": "Churn Prediction (We Miss You)",
                "trigger_type": "churn_prediction_ml",
                "message_template": "It's been a while! Come back for a fresh look.",
                "is_active": True,
                "metrics": {"triggered": 0, "converted": 0}
            },
            {
                "id": str(uuid.uuid4()),
                "salon_id": salon_id,
                "name": "Abandoned Booking Reminder",
                "trigger_type": "abandoned_cart_ml",
                "message_template": "You left something behind! Complete your booking now.",
                "is_active": False,
                "metrics": {"triggered": 0, "converted": 0}
            }
        ]
        automations_collection.insert_many(default_autos)
        for d in default_autos:
            d.pop("_id", None)
        return default_autos
        
    for a in autos:
        a.pop("_id", None)
    return autos

@router.put("/automations/{auto_id}/toggle")
async def toggle_automation(auto_id: str, current_user: dict = Depends(get_current_user)):
    """Toggle automation status dynamically in DB."""
    salon = _get_owner_salon(current_user)
    auto = automations_collection.find_one({"id": auto_id, "salon_id": salon["id"]})
    if not auto:
        raise HTTPException(status_code=404, detail="Automation not found")
        
    new_status = not auto.get("is_active", False)
    automations_collection.update_one(
        {"id": auto_id},
        {"$set": {"is_active": new_status, "updated_at": datetime.utcnow()}}
    )
    return {"status": "success", "is_active": new_status}


@router.post("/automations/{auto_id}/run")
async def run_automation(auto_id: str, current_user: dict = Depends(get_current_user)):
    """Manually run an automation job, specifically the churn prediction win-back."""
    from datetime import timedelta
    import random
    import string
    
    salon = _get_owner_salon(current_user)
    salon_id = salon["id"]
    
    auto = automations_collection.find_one({"id": auto_id, "salon_id": salon_id})
    if not auto:
        raise HTTPException(status_code=404, detail="Automation not found")
        
    if auto.get("trigger_type") != "churn_prediction_ml":
        raise HTTPException(status_code=400, detail="Only churn_prediction_ml is currently supported for manual run")

    # 1. Identify At-Risk Customers
    all_bookings = list(slot_bookings_collection.find({
        "salon_id": salon_id,
        "status": "completed"
    }))

    user_stats = {}
    for b in all_bookings:
        uid = b.get("user_id")
        if not uid: continue
        
        created_at = b.get("created_at")
        if isinstance(created_at, str):
            try: dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            except ValueError: dt = datetime.utcnow()
        elif isinstance(created_at, datetime): dt = created_at
        else: continue

        if uid not in user_stats:
            user_stats[uid] = {"visits": 0, "last_visit": dt}
        
        user_stats[uid]["visits"] += 1
        if dt > user_stats[uid]["last_visit"]:
            user_stats[uid]["last_visit"] = dt

    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    
    target_users = []
    for uid, stats in user_stats.items():
        if stats["visits"] >= 2 and stats["last_visit"] < thirty_days_ago:
            target_users.append(uid)
            
    if not target_users:
        return {"status": "success", "message": "No at-risk customers found right now. Check back later!", "reach": 0}

    # 2. Generate a Unique Win-Back Coupon
    coupon_code = "MISSYOU" + "".join(random.choices(string.digits, k=3))
    coupon = {
        "id": str(uuid.uuid4()),
        "salon_id": salon_id,
        "code": coupon_code,
        "discount_type": "percentage",
        "discount_value": 20,
        "min_booking_amount": 0,
        "valid_from": now.isoformat()[:10],
        "valid_until": (now + timedelta(days=14)).isoformat()[:10],
        "max_uses": len(target_users),
        "used_count": 0,
        "is_active": True,
        "description": "Auto-generated Win-Back campaign coupon",
        "created_at": now
    }
    coupons_collection.insert_one(coupon)

    # 3. Create the Campaign
    message = auto.get("message_template", "We miss you! Come back for a fresh look.")
    message += f" Use code {coupon_code} for 20% off your next visit!"
    
    campaign = {
        "id": str(uuid.uuid4()),
        "salon_id": salon_id,
        "salon_name": salon.get("name"),
        "title": "We Miss You - Win Back Campaign",
        "message": message,
        "campaign_type": "re_engagement",
        "target_audience": "inactive",
        "status": "sent",
        "estimated_reach": len(target_users),
        "sent_count": len(target_users),
        "opened_count": 0,
        "converted_count": 0,
        "target_user_ids": target_users,
        "offer_code": coupon_code,
        "created_by": current_user.get("sub"),
        "created_at": now,
        "sent_at": now
    }
    campaigns_collection.insert_one(campaign)
    
    # 4. Update Automation Metrics
    automations_collection.update_one(
        {"id": auto_id},
        {"$inc": {"metrics.triggered": 1}, "$set": {"last_run": now}}
    )

    return {
        "status": "success", 
        "message": f"Win-back campaign generated and sent to {len(target_users)} customers!",
        "reach": len(target_users)
    }
