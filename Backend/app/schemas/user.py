"""
Enhanced User Schema with Role-Based Access Control
"""
from pydantic import BaseModel, EmailStr, Field
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
    role: str = "CUSTOMER"  # "CUSTOMER", "SALON_OWNER", "STAFF", "ADMIN"
    subscription_start: Optional[datetime] = None
    subscription_end: Optional[datetime] = None
    # Field(default_factory=list) instead of a bare `= []` -- a bare mutable
    # default is a classic Python footgun (the same list object would be
    # reused across instances if pydantic didn't special-case it). Using
    # default_factory makes the "new empty list per instance" intent explicit
    # regardless of pydantic version/internals. No behavior change.
    features: list = Field(default_factory=list)  # List of enabled features


class UserProfile(BaseModel):
    """Complete user profile with role"""
    email: EmailStr
    role: str = "CUSTOMER" # CUSTOMER, SALON_OWNER, STAFF, ADMIN
    phone: Optional[str] = None
    gender: Optional[str] = None
    preferences: Optional[dict] = Field(default_factory=dict)
    subscription_start: Optional[datetime] = None
    subscription_end: Optional[datetime] = None
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    analysis_count: int = 0  # Track usage

    # Premium features
    premium_features: list = Field(default_factory=list)
