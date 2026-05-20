"""
Role-Based Access Control (RBAC) System
Defines permissions for Admin, Expert, Premium, and Normal users
"""
from fastapi import HTTPException, status, Depends
from app.mongodb.user_collection import user_collection
from app.auth.jwt_handler import get_current_user
from datetime import datetime
from typing import List, Optional, Dict

# --- ROLE DEFINITIONS ---
ROLE_ADMIN = "admin"
ROLE_EXPERT = "expert"  # Dermatologists / Beauty Professionals
ROLE_PREMIUM = "premium"
ROLE_USER = "user"    # Normal / Basic user

PERMISSIONS = {
    ROLE_ADMIN: [
        "view_all_users", "manage_roles", "system_analytics", 
        "edit_product_db", "model_config", "view_audit_logs",
        "delete_any_analysis", "broadcast_message"
    ],
    ROLE_EXPERT: [
        "review_analysis", "expert_recommendations", "view_user_history",
        "flag_incorrect_results", "expert_chat"
    ],
    ROLE_PREMIUM: [
        "unlimited_analysis", "advanced_tips", "history_unlimited",
        "export_pdf", "priority_support", "beta_features",
        "custom_reports", "progress_tracking", "consultation_booking"
    ],
    ROLE_USER: [
        "basic_analysis", "standard_tips", "history_limited", "basic_support"
    ]
}

# Usage limits setup
NORMAL_USER_LIMITS = {"analysis_per_month": 10, "history_days": 30}
PREMIUM_USER_LIMITS = {"analysis_per_month": -1, "history_days": -1}

def get_user_role_info(user_email: str) -> dict:
    user = user_collection.find_one({"email": user_email})
    if not user:
        return {"role": ROLE_USER, "permissions": PERMISSIONS[ROLE_USER]}
    
    role = user.get("role", ROLE_USER)
    
    # Compile permissions (Admin gets everything)
    if role == ROLE_ADMIN:
        # Flatten all permissions for admin
        all_perms = set()
        for p_list in PERMISSIONS.values():
            all_perms.update(p_list)
        return {"role": ROLE_ADMIN, "permissions": list(all_perms)}

    # Expert gets expert + basic permissions
    if role == ROLE_EXPERT:
        return {"role": ROLE_EXPERT, "permissions": PERMISSIONS[ROLE_EXPERT] + PERMISSIONS[ROLE_USER]}

    # Premium role checking for expiration
    if role == ROLE_PREMIUM:
        sub_end = user.get("subscription_end")
        if sub_end and isinstance(sub_end, datetime) and sub_end < datetime.utcnow():
            user_collection.update_one({"email": user_email}, {"$set": {"role": ROLE_USER}})
            role = ROLE_USER
            
    return {"role": role, "permissions": PERMISSIONS.get(role, PERMISSIONS[ROLE_USER])}

def has_permission(user_email: str, permission: str) -> bool:
    info = get_user_role_info(user_email)
    return permission in info["permissions"]

def require_role(allowed_roles: List[str]):
    def decorator(current_user: dict = Depends(get_current_user)):
        user_email = current_user.get("sub")
        info = get_user_role_info(user_email)
        if info["role"] not in allowed_roles and info["role"] != ROLE_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {allowed_roles}"
            )
        return current_user
    return decorator

# --- AUDIT LOGGING ---
from app.mongodb.collections import db

def log_admin_action(admin_email: str, action: str, target_user: str = None, details: dict = None):
    audit_collection = db["audit_logs"]
    audit_collection.insert_one({
        "timestamp": datetime.utcnow(),
        "admin_email": admin_email,
        "action": action,
        "target_user": target_user,
        "details": details
    })

# --- EXISTING UTILS ADAPTED ---

def check_usage_limit(user_email: str, limit_type: str) -> dict:
    info = get_user_role_info(user_email)
    user = user_collection.find_one({"email": user_email})
    
    if info["role"] == ROLE_ADMIN:
        return {"allowed": True, "message": "Admin Access"}

    limit = PREMIUM_USER_LIMITS.get(limit_type, -1) if info["role"] == ROLE_PREMIUM else NORMAL_USER_LIMITS.get(limit_type, 10)
    current = user.get("analysis_count_this_month", 0) if user else 0
    
    if limit != -1 and current >= limit:
        return {"allowed": False, "current": current, "limit": limit, "message": "Limit Reached"}
    
    return {"allowed": True, "current": current, "limit": limit, "message": "Access Granted"}

def increment_usage(user_email: str, usage_type: str):
    if usage_type == "analysis":
        user_collection.update_one(
            {"email": user_email},
            {"$inc": {"analysis_count_this_month": 1, "analysis_count_total": 1},
             "$set": {"last_analysis": datetime.utcnow()}},
            upsert=True
        )

# --- LEGACY COMPATIBILITY LAYER ---

# Re-defining features for the pricing and features pages
PREMIUM_FEATURES = {
    "unlimited_analysis": "Unlimited face analysis per month",
    "advanced_tips": "AI-powered personalized tips",
    "history_unlimited": "Unlimited history storage",
    "export_pdf": "Export analysis as PDF",
    "priority_support": "Priority customer support",
    "beta_features": "Access to beta features",
    "custom_reports": "Custom beauty reports",
    "progress_tracking": "Advanced progress tracking",
    "product_recommendations": "Premium product recommendations",
    "consultation_booking": "Book professional consultations"
}

NORMAL_FEATURES = {
    "basic_analysis": "Basic face analysis (10/month)",
    "basic_tips": "Standard beauty tips",
    "history_limited": "30-day history storage",
    "basic_support": "Standard support"
}

def get_user_role(user_email: str) -> dict:
    """Legacy wrapper for get_user_role_info."""
    info = get_user_role_info(user_email)
    
    # Fetch additional sub info for legacy callers
    user = user_collection.find_one({"email": user_email})
    if user:
        info["subscription_start"] = user.get("subscription_start")
        info["subscription_end"] = user.get("subscription_end")
    
    # Map raw permission list to features key for legacy callers
    info["features"] = info["permissions"]
    info["limits"] = PREMIUM_USER_LIMITS if info["role"] == ROLE_PREMIUM else NORMAL_USER_LIMITS
    
    return info

def get_user_stats(user_email: str) -> dict:
    """Legacy stats function."""
    user = user_collection.find_one({"email": user_email})
    role_info = get_user_role(user_email)
    
    if not user:
        return {
            "role": ROLE_USER,
            "analysis_count_total": 0,
            "analysis_count_this_month": 0,
            "features": role_info["features"],
            "limits": role_info["limits"]
        }
    
    return {
        "role": role_info["role"],
        "subscription_end": role_info.get("subscription_end"),
        "analysis_count_total": user.get("analysis_count_total", 0),
        "analysis_count_this_month": user.get("analysis_count_this_month", 0),
        "last_analysis": user.get("last_analysis"),
        "created_at": user.get("created_at"),
        "features": role_info["features"],
        "limits": role_info["limits"],
        "premium_features": PREMIUM_FEATURES if role_info["role"] == ROLE_PREMIUM else {},
        "available_upgrades": PREMIUM_FEATURES if role_info["role"] == ROLE_USER else {}
    }

def upgrade_to_premium(user_email: str, duration_days: int = 30) -> dict:
    """Legacy upgrade function."""
    from datetime import timedelta
    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=duration_days)
    
    user_collection.update_one(
        {"email": user_email},
        {"$set": {
            "role": ROLE_PREMIUM,
            "subscription_start": start_date,
            "subscription_end": end_date
        }},
        upsert=True
    )
    return {"success": True, "message": f"Upgraded to Premium for {duration_days} days"}

def downgrade_from_premium(user_email: str) -> dict:
    """Legacy downgrade function."""
    user_collection.update_one({"email": user_email}, {"$set": {"role": ROLE_USER}})
    return {"success": True, "message": "Subscription cancelled"}

def require_premium(current_user: dict = Depends(get_current_user)):
    """Legacy premium requirement."""
    info = get_user_role_info(current_user["sub"])
    if info["role"] != ROLE_PREMIUM and info["role"] != ROLE_ADMIN:
        raise HTTPException(status_code=403, detail="Premium required")
    return current_user

def require_shop_owner(current_user: dict = Depends(get_current_user)):
    """Require shop_owner or admin role for B2B endpoints."""
    info = get_user_role_info(current_user["sub"])
    if info["role"] not in [ROLE_ADMIN, "shop_owner"]:
        raise HTTPException(
            status_code=403,
            detail="Access denied. This feature is only available to registered Shop Owners."
        )
    return current_user

def require_expert(current_user: dict = Depends(get_current_user)):
    """Require expert or admin role."""
    info = get_user_role_info(current_user["sub"])
    if info["role"] not in [ROLE_ADMIN, ROLE_EXPERT]:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Expert credentials required."
        )
    return current_user
