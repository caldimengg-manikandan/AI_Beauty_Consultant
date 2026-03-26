"""
Enhanced User Schema with Role-Based Access Control
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserSignup(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRole(BaseModel):
    """User role and subscription information"""
    role: str = "normal"  # "normal" or "premium"
    subscription_start: Optional[datetime] = None
    subscription_end: Optional[datetime] = None
    features: list = []  # List of enabled features


class UserProfile(BaseModel):
    """Complete user profile with role"""
    email: EmailStr
    role: str = "normal"
    subscription_start: Optional[datetime] = None
    subscription_end: Optional[datetime] = None
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    analysis_count: int = 0  # Track usage
    
    # Premium features
    premium_features: list = []
