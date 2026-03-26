"""
Premium Subscription & User Role API Routes
"""
from fastapi import APIRouter, HTTPException, Depends, status
from app.auth.rbac import (
    get_user_role, 
    get_user_stats, 
    upgrade_to_premium,
    downgrade_from_premium,
    check_usage_limit,
    PREMIUM_FEATURES,
    NORMAL_FEATURES
)
from app.auth.jwt_handler import get_current_user
from pydantic import BaseModel
from datetime import datetime


router = APIRouter(prefix="/api/user", tags=["User & Premium"])


class UpgradeRequest(BaseModel):
    duration_days: int = 30
    payment_method: str = "demo"  # For now, demo mode


@router.get("/role")
async def get_my_role(current_user: dict = Depends(get_current_user)):
    """Get current user's role and subscription info"""
    user_email = current_user.get("sub")
    role_info = get_user_role(user_email)
    
    return {
        "email": user_email,
        "role": role_info["role"],
        "subscription_start": role_info.get("subscription_start"),
        "subscription_end": role_info.get("subscription_end"),
        "features": role_info["features"],
        "limits": role_info["limits"],
        "is_premium": role_info["role"] == "premium"
    }


@router.get("/stats")
async def get_my_stats(current_user: dict = Depends(get_current_user)):
    """Get user statistics and usage"""
    user_email = current_user.get("sub")
    stats = get_user_stats(user_email)
    
    return stats


@router.get("/features")
async def get_available_features(current_user: dict = Depends(get_current_user)):
    """Get list of all features and user's access"""
    user_email = current_user.get("sub")
    role_info = get_user_role(user_email)
    
    return {
        "current_role": role_info["role"],
        "current_features": {
            feature: (PREMIUM_FEATURES.get(feature) or NORMAL_FEATURES.get(feature))
            for feature in role_info["features"]
        },
        "premium_features": PREMIUM_FEATURES if role_info["role"] == "normal" else {},
        "normal_features": NORMAL_FEATURES
    }


@router.post("/upgrade")
async def upgrade_account(
    upgrade_req: UpgradeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Upgrade user to premium
    In production, this would integrate with payment gateway
    For now, it's a demo upgrade
    """
    user_email = current_user.get("sub")
    
    # Check if already premium
    role_info = get_user_role(user_email)
    if role_info["role"] == "premium":
        return {
            "success": False,
            "message": "You are already a premium user!",
            "subscription_end": role_info.get("subscription_end")
        }
    
    # Demo mode: Allow instant upgrade
    if upgrade_req.payment_method == "demo":
        result = upgrade_to_premium(user_email, upgrade_req.duration_days)
        return result
    
    # In production, integrate payment gateway here
    # Example: Stripe, PayPal, Razorpay, etc.
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Payment integration not yet implemented. Use 'demo' payment method for testing."
    )
    

@router.post("/downgrade")
async def downgrade_account(current_user: dict = Depends(get_current_user)):
    """
    Downgrade user back to normal role (Cancel Premium)
    """
    user_email = current_user.get("sub")
    result = downgrade_from_premium(user_email)
    return result


@router.get("/usage")
async def check_my_usage(current_user: dict = Depends(get_current_user)):
    """Check current usage against limits"""
    user_email = current_user.get("sub")
    
    analysis_limit = check_usage_limit(user_email, "analysis_per_month")
    
    return {
        "analysis": analysis_limit,
        "can_analyze": analysis_limit["allowed"]
    }


@router.get("/pricing")
async def get_pricing():
    """Get premium pricing information"""
    return {
        "plans": [
            {
                "name": "Normal",
                "price": 0,
                "currency": "INR",
                "period": "forever",
                "features": list(NORMAL_FEATURES.values()),
                "limits": {
                    "analyses_per_month": 10,
                    "history_days": 30,
                    "tips_count": 3
                }
            },
            {
                "name": "Premium Monthly",
                "price": 799,
                "currency": "INR",
                "period": "month",
                "duration_days": 30,
                "features": list(PREMIUM_FEATURES.values()),
                "limits": {
                    "analyses_per_month": "Unlimited",
                    "history_days": "Unlimited",
                    "tips_count": 7
                },
                "popular": True
            },
            {
                "name": "Premium Yearly",
                "price": 7999,
                "currency": "INR",
                "period": "year",
                "duration_days": 365,
                "features": list(PREMIUM_FEATURES.values()),
                "limits": {
                    "analyses_per_month": "Unlimited",
                    "history_days": "Unlimited",
                    "tips_count": 7
                },
                "savings": "Save 17%"
            }
        ]
    }
