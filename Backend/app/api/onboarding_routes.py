"""
Onboarding Quiz API Routes
Handles first-time user profile/preferences storage
"""
from fastapi import APIRouter, HTTPException, Depends
from app.auth.jwt_handler import get_current_user
from app.mongodb.client import db
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/onboarding", tags=["Onboarding"])

onboarding_collection = db["onboarding_profiles"]


class OnboardingProfile(BaseModel):
    # Basic Info
    display_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None  # Female, Male, Other

    # Skin Info
    current_skin_type: Optional[str] = None   # Oily, Dry, Combination, Normal, Sensitive
    skin_concerns: Optional[List[str]] = []   # Acne, Dark Spots, Fine Lines, Pigmentation, etc.
    skin_history: Optional[str] = None        # Free text

    # Goals
    beauty_goals: Optional[List[str]] = []    # Clearer Skin, Anti-Aging, Hydration, Glow, etc.
    budget_range: Optional[str] = None        # Budget (<500), Mid-range (500-2000), Premium (2000+)
    routine_style: Optional[str] = None       # Minimal, Moderate, Full Routine

    # Allergies
    allergies: Optional[List[str]] = []       # Fragrance, Parabens, Sulfates, Nuts, etc.
    current_products: Optional[str] = None    # Free text

    # Lifestyle
    sun_exposure: Optional[str] = None        # Rarely, 1-2 hrs, 3+ hrs daily
    diet: Optional[str] = None                # Vegetarian, Vegan, Non-Veg, Mixed
    water_intake: Optional[str] = None        # < 1L, 1-2L, 2L+
    stress_level: Optional[str] = None        # Low, Medium, High

    # Notifications
    weekly_report: Optional[bool] = True
    routine_reminders: Optional[bool] = True
    email_notifications: Optional[bool] = True


@router.post("/save")
async def save_onboarding(
    profile: OnboardingProfile,
    current_user: dict = Depends(get_current_user)
):
    """Save or update onboarding profile for the current user."""
    user_email = current_user.get("sub")

    profile_dict = profile.dict()
    profile_dict["user_email"] = user_email
    profile_dict["updated_at"] = datetime.utcnow()

    existing = onboarding_collection.find_one({"user_email": user_email})
    if existing:
        onboarding_collection.update_one(
            {"user_email": user_email},
            {"$set": profile_dict}
        )
    else:
        profile_dict["created_at"] = datetime.utcnow()
        onboarding_collection.insert_one(profile_dict)

    return {
        "success": True,
        "message": "Beauty profile saved successfully!",
        "user_email": user_email
    }


@router.get("/profile")
async def get_onboarding_profile(current_user: dict = Depends(get_current_user)):
    """Get the onboarding profile for the current user."""
    user_email = current_user.get("sub")
    profile = onboarding_collection.find_one({"user_email": user_email})

    if not profile:
        return {"exists": False, "profile": None}

    profile.pop("_id", None)
    return {"exists": True, "profile": profile}


@router.get("/status")
async def onboarding_status(current_user: dict = Depends(get_current_user)):
    """Returns whether the user has completed onboarding."""
    user_email = current_user.get("sub")
    profile = onboarding_collection.find_one({"user_email": user_email})
    return {
        "completed": profile is not None,
        "user_email": user_email
    }


@router.delete("/reset")
async def reset_onboarding(current_user: dict = Depends(get_current_user)):
    """Delete/reset the onboarding profile so the wizard shows again."""
    user_email = current_user.get("sub")
    onboarding_collection.delete_one({"user_email": user_email})
    return {"success": True, "message": "Onboarding profile reset"}
