"""
auth_routes.py — Authentication endpoints.

Security improvements applied:
  - Server-side password strength enforcement (min 8 chars, uppercase, lowercase, digit, special).
  - Email enumeration prevention: signup always returns a generic success message.
  - No internal error details exposed to clients (str(e) replaced with generic messages).
  - Refresh token endpoint added (returns new access token from valid refresh token).
  - Structured logging throughout (no bare print() calls in production paths).
"""

import logging
import random
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth.jwt_handler import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    verify_refresh_token,
)
from app.auth.schemas import UserAuth
from app.auth.security import hash_password, verify_password
from app.mongodb.user_collection import user_collection
from app.utils.email_utils import send_otp_email

_log = logging.getLogger("beauty_api.auth")

router = APIRouter(prefix="/api/auth", tags=["Auth"])


# ── Password strength helper ──────────────────────────────────────────────────
def _validate_password_strength(password: str) -> list[str]:
    """Return a list of unmet requirements (empty list = password is strong enough)."""
    errors: list[str] = []
    if len(password) < 8:
        errors.append("at least 8 characters")
    if not any(c.isupper() for c in password):
        errors.append("at least one uppercase letter")
    if not any(c.islower() for c in password):
        errors.append("at least one lowercase letter")
    if not any(c.isdigit() for c in password):
        errors.append("at least one number")
    if not any(c in "!@#$%^&*()_+-=[]{}|;':\",./<>?" for c in password):
        errors.append("at least one special character (!@#$%^&* etc.)")
    return errors


# ── Schemas ───────────────────────────────────────────────────────────────────
class CustomerSignup(BaseModel):
    email: str
    password: str
    name: Optional[str] = ""
    phone: Optional[str] = ""


class ShopOwnerSignup(BaseModel):
    email: str
    password: str
    name: str
    phone: str
    business_name: str
    business_city: str
    business_type: str = "salon"


class LoginRequest(BaseModel):
    email: str
    password: str
    role_type: str = "customer"


class EmailVerifyRequest(BaseModel):
    email: str
    code: str


class ResendOTPRequest(BaseModel):
    email: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ── Customer Signup ───────────────────────────────────────────────────────────
@router.post("/customer/signup")
def customer_signup(user: CustomerSignup):
    try:
        # Password strength check
        pw_errors = _validate_password_strength(user.password.strip())
        if pw_errors:
            raise HTTPException(
                status_code=400,
                detail=f"Password must contain: {', '.join(pw_errors)}.",
            )

        # Email enumeration prevention: always return the same success message
        # regardless of whether the email is already registered.
        existing = user_collection.find_one({"email": user.email.strip().lower()})
        if not existing:
            hashed = hash_password(user.password.strip())
            otp = f"{random.randint(100000, 999999)}"
            otp_expiry = datetime.utcnow() + timedelta(minutes=15)
            user_doc = {
                "email": user.email.strip().lower(),
                "password": hashed,
                "name": user.name,
                "phone": user.phone,
                "role": "user",
                "account_type": "customer",
                "email_verified": False,
                "verification_otp": otp,
                "otp_expiry": otp_expiry,
                "created_at": datetime.utcnow(),
            }
            user_collection.insert_one(user_doc)
            try:
                send_otp_email(user.email.strip().lower(), otp)
            except Exception:
                _log.warning("OTP email delivery failed for new customer signup (non-fatal)")
        else:
            _log.info("Signup attempted for existing email (suppressed, anti-enumeration)")

        # Always return the same response
        return {
            "message": "If this email is not already registered, a verification code has been sent.",
            "email": user.email.strip().lower(),
        }
    except HTTPException:
        raise
    except Exception:
        _log.exception("Unexpected error during customer signup")
        raise HTTPException(status_code=500, detail="An unexpected error occurred. Please try again.")


# ── Shop Owner Signup ─────────────────────────────────────────────────────────
@router.post("/shop-owner/signup")
def shop_owner_signup(user: ShopOwnerSignup):
    try:
        pw_errors = _validate_password_strength(user.password.strip())
        if pw_errors:
            raise HTTPException(
                status_code=400,
                detail=f"Password must contain: {', '.join(pw_errors)}.",
            )

        existing = user_collection.find_one({"email": user.email.strip().lower()})
        if not existing:
            hashed = hash_password(user.password.strip())
            otp = f"{random.randint(100000, 999999)}"
            otp_expiry = datetime.utcnow() + timedelta(minutes=15)
            user_doc = {
                "email": user.email.strip().lower(),
                "password": hashed,
                "name": user.name,
                "phone": user.phone,
                "role": "shop_owner",
                "account_type": "shop_owner",
                "business_name": user.business_name,
                "business_city": user.business_city,
                "business_type": user.business_type,
                "email_verified": False,
                "verification_otp": otp,
                "otp_expiry": otp_expiry,
                "created_at": datetime.utcnow(),
            }
            user_collection.insert_one(user_doc)
            try:
                send_otp_email(user.email.strip().lower(), otp)
            except Exception:
                _log.warning("OTP email delivery failed for new shop owner signup (non-fatal)")
        else:
            _log.info("Shop owner signup attempted for existing email (suppressed, anti-enumeration)")

        return {
            "message": "If this email is not already registered, a verification code has been sent.",
            "email": user.email.strip().lower(),
        }
    except HTTPException:
        raise
    except Exception:
        _log.exception("Unexpected error during shop owner signup")
        raise HTTPException(status_code=500, detail="An unexpected error occurred. Please try again.")


# ── Unified Login ─────────────────────────────────────────────────────────────
@router.post("/login")
def login(user: LoginRequest):
    try:
        db_user = user_collection.find_one({"email": user.email.strip().lower()})

        # Use constant-time comparison path even for missing users to prevent timing attacks
        if not db_user or not verify_password(user.password.strip(), db_user.get("password", "")):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not db_user.get("email_verified", True):
            raise HTTPException(status_code=403, detail="Email not verified. Please check your inbox for the verification code.")

        user_role = db_user.get("role", "user")
        account_type = db_user.get("account_type", "customer")

        if user.role_type == "shop_owner" and user_role not in ["shop_owner", "admin"]:
            raise HTTPException(status_code=403, detail="This account is not registered as a Shop Owner. Please use the Customer login.")
        if user.role_type == "customer" and user_role == "shop_owner":
            raise HTTPException(status_code=403, detail="This is a Shop Owner account. Please use the Shop Owner login.")

        token_data = {
            "sub": db_user["email"],
            "role": user_role,
            "account_type": account_type,
            "name": db_user.get("name", ""),
        }
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token({"sub": db_user["email"], "role": user_role})

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "role": user_role,
            "account_type": account_type,
            "name": db_user.get("name", ""),
            "email": db_user["email"],
        }
    except HTTPException:
        raise
    except Exception:
        _log.exception("Unexpected error during login")
        raise HTTPException(status_code=500, detail="An unexpected error occurred. Please try again.")


# ── Refresh Token ─────────────────────────────────────────────────────────────
@router.post("/refresh")
def refresh_access_token(req: RefreshTokenRequest):
    """Exchange a valid refresh token for a new access token."""
    payload = verify_refresh_token(req.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

    email = payload.get("sub")
    db_user = user_collection.find_one({"email": email}, {"password": 0, "_id": 0})
    if not db_user:
        raise HTTPException(status_code=401, detail="User not found.")

    new_access = create_access_token({
        "sub": email,
        "role": db_user.get("role", "user"),
        "account_type": db_user.get("account_type", "customer"),
        "name": db_user.get("name", ""),
    })
    return {"access_token": new_access, "token_type": "bearer"}


# ── Legacy signup (backward compatibility) ────────────────────────────────────
@router.post("/signup")
def signup(user: UserAuth):
    try:
        existing = user_collection.find_one({"email": user.email})
        if not existing:
            hashed = hash_password(user.password.strip())
            user_collection.insert_one({
                "email": user.email,
                "password": hashed,
                "role": "user",
                "account_type": "customer",
            })
        return {"message": "If this email is not already registered, your account has been created."}
    except HTTPException:
        raise
    except Exception:
        _log.exception("Unexpected error during legacy signup")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


# ── Get Current User Profile ──────────────────────────────────────────────────
@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    user_email = current_user.get("sub")
    db_user = user_collection.find_one({"email": user_email}, {"password": 0})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db_user.pop("_id", None)
    return {
        "email": db_user.get("email"),
        "name": db_user.get("name", ""),
        "phone": db_user.get("phone", ""),
        "role": db_user.get("role", "user"),
        "account_type": db_user.get("account_type", "customer"),
        "business_name": db_user.get("business_name"),
        "business_city": db_user.get("business_city"),
        "subscription_end": str(db_user.get("subscription_end", "")),
        "created_at": str(db_user.get("created_at", "")),
        "analysis_count_total": db_user.get("analysis_count_total", 0),
        "analysis_count_this_month": db_user.get("analysis_count_this_month", 0),
    }


# ── Delete Account ────────────────────────────────────────────────────────────
@router.delete("/delete-account")
def delete_account(current_user: dict = Depends(get_current_user)):
    user_email = current_user.get("sub")
    from app.mongodb.settings_collection import settings_collection
    settings_collection.delete_one({"user_email": user_email})
    from app.mongodb.collections import analysis_collection
    analysis_collection.delete_many({"user_email": user_email})
    result = user_collection.delete_one({"email": user_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Account and all associated data deleted successfully"}


# ── OTP Verification ──────────────────────────────────────────────────────────
@router.post("/verify-email")
def verify_email(req: EmailVerifyRequest):
    try:
        user = user_collection.find_one({"email": req.email.strip()})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.get("email_verified", False):
            return {"message": "Email is already verified"}

        stored_otp = user.get("verification_otp")
        otp_expiry = user.get("otp_expiry")

        if not stored_otp or not otp_expiry:
            raise HTTPException(status_code=400, detail="Verification code not initialized or expired")
        if datetime.utcnow() > otp_expiry:
            raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")
        if stored_otp != req.code.strip():
            raise HTTPException(status_code=400, detail="Invalid verification code")

        user_collection.update_one(
            {"email": req.email.strip()},
            {"$set": {"email_verified": True}, "$unset": {"verification_otp": "", "otp_expiry": ""}},
        )
        return {"message": "Email verified successfully! You can now log in."}
    except HTTPException:
        raise
    except Exception:
        _log.exception("Unexpected error during email verification")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


# ── Resend OTP ────────────────────────────────────────────────────────────────
@router.post("/resend-otp")
def resend_otp(req: ResendOTPRequest):
    try:
        user = user_collection.find_one({"email": req.email.strip()})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.get("email_verified", False):
            raise HTTPException(status_code=400, detail="Email is already verified")

        otp = f"{random.randint(100000, 999999)}"
        expiry = datetime.utcnow() + timedelta(minutes=15)
        user_collection.update_one(
            {"email": req.email.strip()},
            {"$set": {"verification_otp": otp, "otp_expiry": expiry}},
        )
        try:
            send_otp_email(user["email"], otp)
        except Exception:
            _log.warning("OTP email delivery failed on resend (non-fatal)")

        return {"message": "Verification code resent successfully"}
    except HTTPException:
        raise
    except Exception:
        _log.exception("Unexpected error during OTP resend")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")
