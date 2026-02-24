"""
Settings API routes
"""
from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.settings import UserSettings, SettingsUpdate
from app.mongodb.settings_collection import settings_collection
from app.auth.jwt_handler import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("/", response_model=UserSettings)
async def get_settings(current_user: dict = Depends(get_current_user)):
    """Get user settings"""
    user_email = current_user.get("sub")
    
    settings = settings_collection.find_one({"user_email": user_email})
    
    if not settings:
        # Return default settings if none exist
        default_settings = UserSettings(user_email=user_email)
        return default_settings
    
    # Remove MongoDB _id field
    settings.pop("_id", None)
    return settings


@router.post("/", response_model=UserSettings)
async def save_settings(
    settings: UserSettings,
    current_user: dict = Depends(get_current_user)
):
    """Save or create user settings"""
    user_email = current_user.get("sub")
    
    # Ensure the settings belong to the current user
    settings.user_email = user_email
    settings.updated_at = datetime.utcnow()
    
    # Check if settings exist
    existing = settings_collection.find_one({"user_email": user_email})
    
    if existing:
        # Update existing settings
        settings_dict = settings.dict(exclude_unset=True)
        settings_collection.update_one(
            {"user_email": user_email},
            {"$set": settings_dict}
        )
    else:
        # Create new settings
        settings.created_at = datetime.utcnow()
        settings_dict = settings.dict()
        settings_collection.insert_one(settings_dict)
    
    # Return updated settings
    updated = settings_collection.find_one({"user_email": user_email})
    updated.pop("_id", None)
    return updated


@router.patch("/", response_model=UserSettings)
async def update_settings(
    updates: SettingsUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Partially update user settings"""
    user_email = current_user.get("sub")
    
    # Get existing settings
    existing = settings_collection.find_one({"user_email": user_email})
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Settings not found. Please create settings first."
        )
    
    # Prepare update data
    update_data = updates.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    # Update settings
    settings_collection.update_one(
        {"user_email": user_email},
        {"$set": update_data}
    )
    
    # Return updated settings
    updated = settings_collection.find_one({"user_email": user_email})
    updated.pop("_id", None)
    return updated


@router.delete("/")
async def reset_settings(current_user: dict = Depends(get_current_user)):
    """Reset settings to defaults"""
    user_email = current_user.get("sub")
    
    # Delete existing settings
    result = settings_collection.delete_one({"user_email": user_email})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No settings found to delete"
        )
    
    return {"message": "Settings reset to defaults"}


@router.get("/export")
async def export_settings(current_user: dict = Depends(get_current_user)):
    """Export user settings as JSON"""
    user_email = current_user.get("sub")
    
    settings = settings_collection.find_one({"user_email": user_email})
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No settings found"
        )
    
    # Remove MongoDB _id
    settings.pop("_id", None)
    
    return {
        "user_email": user_email,
        "settings": settings,
        "exported_at": datetime.utcnow().isoformat()
    }
