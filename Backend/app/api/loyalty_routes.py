"""
Loyalty & Wallet Routes — Customer B2C
Handles: points wallet, tier upgrades, rewards, referrals
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.mongodb.collections import loyalty_collection, users_collection, slot_bookings_collection
from app.auth.jwt_handler import get_current_user
import uuid

router = APIRouter(prefix="/api/loyalty", tags=["Loyalty & Wallet"])

# ── Tier Configuration ────────────────────────────────────────────────────────
TIERS = {
    "Bronze":   {"min_points": 0,     "cashback_pct": 2,  "perks": ["Priority support"]},
    "Silver":   {"min_points": 500,   "cashback_pct": 5,  "perks": ["5% cashback", "Priority booking", "Free consultation"]},
    "Gold":     {"min_points": 2000,  "cashback_pct": 10, "perks": ["10% cashback", "Free birthday service", "Express slot"]},
    "Platinum": {"min_points": 5000,  "cashback_pct": 15, "perks": ["15% cashback", "Dedicated stylist", "Free monthly facial", "VIP lounge"]},
}
POINTS_PER_RUPEE = 1         # 1 point per ₹1 spent
POINTS_REDEEM_VALUE = 0.50   # 1 point = ₹0.50


def _get_tier(points: int) -> str:
    for tier in reversed(list(TIERS.keys())):
        if points >= TIERS[tier]["min_points"]:
            return tier
    return "Bronze"

def _next_tier(current_tier: str) -> Optional[dict]:
    tiers_list = list(TIERS.keys())
    idx = tiers_list.index(current_tier)
    if idx + 1 < len(tiers_list):
        next_t = tiers_list[idx + 1]
        return {"name": next_t, "points_needed": TIERS[next_t]["min_points"]}
    return None

def _strip(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


# ── Get / Init Wallet ─────────────────────────────────────────────────────────

@router.get("/wallet")
async def get_wallet(current_user: dict = Depends(get_current_user)):
    """Get or initialize the user's loyalty wallet."""
    user_id = current_user.get("sub")
    wallet = loyalty_collection.find_one({"user_id": user_id})
    if not wallet:
        # Auto-initialize wallet on first access
        wallet = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "points": 0,
            "wallet_balance": 0.0,   # redeemable cash equivalent
            "total_points_earned": 0,
            "total_points_redeemed": 0,
            "tier": "Bronze",
            "transactions": [],
            "created_at": datetime.utcnow()
        }
        loyalty_collection.insert_one(wallet)
        wallet.pop("_id", None)

    tier = _get_tier(wallet["points"])
    next_tier = _next_tier(tier)
    points_to_next = (next_tier["points_needed"] - wallet["points"]) if next_tier else 0

    return {
        **_strip(wallet),
        "tier": tier,
        "tier_config": TIERS[tier],
        "next_tier": next_tier,
        "points_to_next_tier": max(0, points_to_next),
        "wallet_balance_inr": round(wallet["points"] * POINTS_REDEEM_VALUE, 2),
        "tier_progress_pct": min(100, int(
            ((wallet["points"] - TIERS[tier]["min_points"]) /
             max(1, (next_tier["points_needed"] - TIERS[tier]["min_points"]) if next_tier else 1)) * 100
        ))
    }


# ── Earn Points ───────────────────────────────────────────────────────────────

@router.post("/earn")
async def earn_points(
    booking_id: str,
    amount_paid: float,
    current_user: dict = Depends(get_current_user)
):
    """Award points after a completed booking. Called post-payment."""
    user_id = current_user.get("sub")
    points_earned = int(amount_paid * POINTS_PER_RUPEE)

    wallet = loyalty_collection.find_one({"user_id": user_id})
    if not wallet:
        # Auto-create if missing
        wallet = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "points": 0,
            "total_points_earned": 0,
            "total_points_redeemed": 0,
            "tier": "Bronze",
            "transactions": [],
            "created_at": datetime.utcnow()
        }
        loyalty_collection.insert_one(wallet)

    transaction = {
        "id": str(uuid.uuid4()),
        "type": "earn",
        "points": points_earned,
        "description": f"Booking #{booking_id} — Earned {points_earned} pts",
        "booking_id": booking_id,
        "amount_paid": amount_paid,
        "timestamp": datetime.utcnow()
    }

    loyalty_collection.update_one(
        {"user_id": user_id},
        {
            "$inc": {"points": points_earned, "total_points_earned": points_earned},
            "$push": {"transactions": transaction},
            "$set": {"last_updated": datetime.utcnow()}
        }
    )

    updated = loyalty_collection.find_one({"user_id": user_id})
    new_tier = _get_tier(updated["points"])

    return {
        "status": "success",
        "points_earned": points_earned,
        "total_points": updated["points"],
        "tier": new_tier,
        "message": f"🎉 You earned {points_earned} loyalty points!"
    }


# ── Redeem Points ─────────────────────────────────────────────────────────────

@router.post("/redeem")
async def redeem_points(
    points_to_redeem: int,
    booking_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Redeem points as wallet cash for a booking."""
    if points_to_redeem < 100:
        raise HTTPException(status_code=400, detail="Minimum redemption is 100 points")
    user_id = current_user.get("sub")
    wallet = loyalty_collection.find_one({"user_id": user_id})
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    if wallet["points"] < points_to_redeem:
        raise HTTPException(status_code=400, detail=f"Insufficient points. You have {wallet['points']} pts")

    cash_value = round(points_to_redeem * POINTS_REDEEM_VALUE, 2)
    transaction = {
        "id": str(uuid.uuid4()),
        "type": "redeem",
        "points": -points_to_redeem,
        "cash_value": cash_value,
        "description": f"Redeemed {points_to_redeem} pts = ₹{cash_value}",
        "booking_id": booking_id,
        "timestamp": datetime.utcnow()
    }
    loyalty_collection.update_one(
        {"user_id": user_id},
        {
            "$inc": {"points": -points_to_redeem, "total_points_redeemed": points_to_redeem},
            "$push": {"transactions": transaction},
            "$set": {"last_updated": datetime.utcnow()}
        }
    )
    return {
        "status": "success",
        "points_redeemed": points_to_redeem,
        "cash_value": cash_value,
        "remaining_points": wallet["points"] - points_to_redeem,
        "message": f"✅ ₹{cash_value} discount applied from loyalty points"
    }


# ── Transaction History ───────────────────────────────────────────────────────

@router.get("/transactions")
async def get_transactions(
    limit: int = Query(20, le=100),
    current_user: dict = Depends(get_current_user)
):
    wallet = loyalty_collection.find_one({"user_id": current_user.get("sub")})
    if not wallet:
        return {"transactions": []}
    txns = sorted(
        wallet.get("transactions", []),
        key=lambda x: x.get("timestamp", datetime.min),
        reverse=True
    )
    return {"transactions": txns[:limit]}


# ── Tier Benefits ─────────────────────────────────────────────────────────────

@router.get("/tiers")
async def get_tier_info():
    """Public — return all tier definitions."""
    return {
        "tiers": [
            {
                "name": name,
                "min_points": config["min_points"],
                "cashback_pct": config["cashback_pct"],
                "perks": config["perks"],
                "points_value_inr": POINTS_REDEEM_VALUE
            }
            for name, config in TIERS.items()
        ],
        "earning_rate": f"{POINTS_PER_RUPEE} point per ₹1 spent",
        "redemption_rate": f"1 point = ₹{POINTS_REDEEM_VALUE}"
    }


# ── Referral ──────────────────────────────────────────────────────────────────

@router.post("/referral/apply")
async def apply_referral(referral_code: str, current_user: dict = Depends(get_current_user)):
    """Apply a referral code to earn bonus points."""
    user_id = current_user.get("sub")
    referrer = users_collection.find_one({"referral_code": referral_code.upper()})
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    if referrer.get("email") == user_id:
        raise HTTPException(status_code=400, detail="Cannot use your own referral code")
    wallet = loyalty_collection.find_one({"user_id": user_id})
    if wallet and wallet.get("referral_applied"):
        raise HTTPException(status_code=400, detail="Referral already applied")

    # Award 200 pts to new user + 100 pts to referrer
    REFERRAL_BONUS_NEW    = 200
    REFERRAL_BONUS_REFERER = 100

    for uid, pts, desc in [
        (user_id, REFERRAL_BONUS_NEW, f"Welcome bonus — referred by {referral_code}"),
        (referrer["email"], REFERRAL_BONUS_REFERER, f"Referral bonus — {user_id} joined")
    ]:
        loyalty_collection.update_one(
            {"user_id": uid},
            {
                "$inc": {"points": pts, "total_points_earned": pts},
                "$push": {"transactions": {
                    "id": str(uuid.uuid4()),
                    "type": "referral",
                    "points": pts,
                    "description": desc,
                    "timestamp": datetime.utcnow()
                }},
                "$set": {"last_updated": datetime.utcnow()}
            },
            upsert=True
        )

    loyalty_collection.update_one({"user_id": user_id}, {"$set": {"referral_applied": True}})
    return {"status": "success", "message": f"🎁 {REFERRAL_BONUS_NEW} bonus points added to your wallet!"}
