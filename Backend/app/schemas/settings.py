"""
Settings Pydantic schemas for validation
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class AnalysisPreferences(BaseModel):
    skin_type: str = "combination"
    analysis_detail: str = "detailed"
    auto_save: bool = True


class CameraSettings(BaseModel):
    default_camera: str = "front"
    image_quality: str = "high"
    lighting_guidance: bool = True
    grid_overlay: bool = False
    auto_capture: bool = False


class AIModelSettings(BaseModel):
    model_config = {'protected_namespaces': ()}
    
    model_version: str = "latest"
    analysis_speed: str = "balanced"
    confidence_threshold: int = 70
    beta_features: bool = False


class NotificationSettings(BaseModel):
    push_notifications: bool = True
    email_notifications: bool = False
    skin_routine_reminder: bool = False
    reanalysis_reminder: str = "weekly"


class PrivacySettings(BaseModel):
    data_sharing: bool = False
    auto_delete: str = "never"
    history_retention: str = "forever"


class GoalsSettings(BaseModel):
    skin_goals: List[str] = ["clear-skin"]
    target_timeline: str = "3-months"
    progress_photos: bool = True
    goal_reminders: bool = True


class ProductPreferences(BaseModel):
    ingredient_prefs: List[str] = ["natural"]
    price_range: List[int] = [0, 100]
    show_sponsored: bool = True


class AccessibilitySettings(BaseModel):
    font_size: str = "medium"
    high_contrast: bool = False
    reduce_motion: bool = False


class ProfileSettings(BaseModel):
    age_range: str = "25-34"
    gender: str = "prefer-not-to-say"
    skin_concerns: List[str] = []
    allergies: str = ""
    budget_preference: str = "medium"


class UserSettings(BaseModel):
    """Complete user settings model"""
    user_email: str
    language: str = "en"
    dark_mode: bool = False
    
    # Nested settings
    profile: ProfileSettings = ProfileSettings()
    analysis: AnalysisPreferences = AnalysisPreferences()
    camera: CameraSettings = CameraSettings()
    ai_model: AIModelSettings = AIModelSettings()
    notifications: NotificationSettings = NotificationSettings()
    privacy: PrivacySettings = PrivacySettings()
    goals: GoalsSettings = GoalsSettings()
    products: ProductPreferences = ProductPreferences()
    accessibility: AccessibilitySettings = AccessibilitySettings()
    
    # Metadata
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SettingsUpdate(BaseModel):
    """Partial settings update"""
    language: Optional[str] = None
    dark_mode: Optional[bool] = None
    profile: Optional[ProfileSettings] = None
    analysis: Optional[AnalysisPreferences] = None
    camera: Optional[CameraSettings] = None
    ai_model: Optional[AIModelSettings] = None
    notifications: Optional[NotificationSettings] = None
    privacy: Optional[PrivacySettings] = None
    goals: Optional[GoalsSettings] = None
    products: Optional[ProductPreferences] = None
    accessibility: Optional[AccessibilitySettings] = None
