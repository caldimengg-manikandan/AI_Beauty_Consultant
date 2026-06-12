from fastapi import APIRouter, HTTPException, Depends
from app.auth.jwt_handler import get_current_user
from app.mongodb.user_collection import user_collection
from app.auth.security import hash_password, verify_password
from app.auth.jwt_handler import create_access_token
from app.auth.schemas import UserAuth
from pydantic import BaseModel
from typing import Optional
import random
from datetime import datetime, timedelta
from app.utils.email_utils import send_otp_email

router = APIRouter(prefix="/api/auth", tags=["Auth"])


# ─── Schemas ──────────────────────────────────────────────────────────────────
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
    business_type: str = "salon"  # parlour | salon | spa

class LoginRequest(BaseModel):
    email: str
    password: str
    role_type: str = "customer"  # "customer" | "shop_owner"


class EmailVerifyRequest(BaseModel):
    email: str
    code: str


class ResendOTPRequest(BaseModel):
    email: str


# ─── Customer Signup ──────────────────────────────────────────────────────────
@router.post("/customer/signup")
def customer_signup(user: CustomerSignup):
    try:
        if user_collection.find_one({"email": user.email}):
            raise HTTPException(status_code=400, detail="Email already registered")

        hashed = hash_password(user.password.strip())
        otp = f"{random.randint(100000, 999999)}"
        otp_expiry = datetime.utcnow() + timedelta(minutes=15)
        
        user_doc = {
            "email": user.email,
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
        send_otp_email(user.email, otp)
        
        return {
            "message": "Account created successfully! Please verify your email.",
            "email": user.email
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Shop Owner Signup ────────────────────────────────────────────────────────
@router.post("/shop-owner/signup")
def shop_owner_signup(user: ShopOwnerSignup):
    try:
        if user_collection.find_one({"email": user.email}):
            raise HTTPException(status_code=400, detail="Email already registered")

        hashed = hash_password(user.password.strip())
        otp = f"{random.randint(100000, 999999)}"
        otp_expiry = datetime.utcnow() + timedelta(minutes=15)
        
        user_doc = {
            "email": user.email,
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
        send_otp_email(user.email, otp)
        
        return {
            "message": "Shop owner account created! Please verify your email.",
            "email": user.email
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Unified Login (role-aware) ───────────────────────────────────────────────
@router.post("/login")
def login(user: LoginRequest):
    try:
        print(f"DEBUG: Login attempt for {user.email} as {user.role_type}")
        db_user = user_collection.find_one({"email": user.email})

        if not db_user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not verify_password(user.password.strip(), db_user["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Email verification check
        if not db_user.get("email_verified", True):
            raise HTTPException(
                status_code=403,
                detail="Email not verified"
            )

        user_role = db_user.get("role", "user")
        account_type = db_user.get("account_type", "customer")

        # Role-type validation: prevent customers logging in as shop owners and vice versa
        if user.role_type == "shop_owner" and user_role not in ["shop_owner", "admin"]:
            raise HTTPException(
                status_code=403,
                detail="This account is not registered as a Shop Owner. Please use the Customer login."
            )
        if user.role_type == "customer" and user_role in ["shop_owner"]:
            raise HTTPException(
                status_code=403,
                detail="This is a Shop Owner account. Please use the Shop Owner login."
            )

        token = create_access_token({
            "sub": db_user["email"],
            "role": user_role,
            "account_type": account_type,
            "name": db_user.get("name", ""),
        })

        print(f"DEBUG: Login successful for {user.email}, role={user_role}")
        return {
            "access_token": token,
            "token_type": "bearer",
            "role": user_role,
            "account_type": account_type,
            "name": db_user.get("name", ""),
            "email": db_user["email"],
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─── Legacy signup (keep for compatibility) ───────────────────────────────────
@router.post("/signup")
def signup(user: UserAuth):
    try:
        if user_collection.find_one({"email": user.email}):
            raise HTTPException(status_code=400, detail="User already exists")
        hashed = hash_password(user.password.strip())
        user_doc = {
            "email": user.email,
            "password": hashed,
            "role": "user",
            "account_type": "customer",
        }
        user_collection.insert_one(user_doc)
        return {"message": "User registered successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Get Current User Profile ────────────────────────────────────────────────
@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """Returns the authenticated user's profile including role."""
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

# ─── Delete Account ───────────────────────────────────────────────────────────
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


# ─── OTP Verification and Resending ───────────────────────────────────────────
@router.post("/verify-email")
def verify_email(req: EmailVerifyRequest):
    try:
        user = user_collection.find_one({"email": req.email.strip()})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if already verified
        if user.get("email_verified", False):
            return {"message": "Email is already verified"}

        stored_otp = user.get("verification_otp")
        otp_expiry = user.get("otp_expiry")

        if not stored_otp or not otp_expiry:
            raise HTTPException(status_code=400, detail="Verification code not initialized or expired")

        # Check expiry
        if datetime.utcnow() > otp_expiry:
            raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")

        # Verify code
        if stored_otp != req.code.strip():
            raise HTTPException(status_code=400, detail="Invalid verification code")

        # Verify user
        user_collection.update_one(
            {"email": req.email.strip()},
            {
                "$set": {"email_verified": True},
                "$unset": {"verification_otp": "", "otp_expiry": ""}
            }
        )
        return {"message": "Email verified successfully! You can now log in."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/resend-otp")
def resend_otp(req: ResendOTPRequest):
    try:
        user = user_collection.find_one({"email": req.email.strip()})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if user.get("email_verified", False):
            raise HTTPException(status_code=400, detail="Email is already verified")

        # Generate new OTP
        otp = f"{random.randint(100000, 999999)}"
        expiry = datetime.utcnow() + timedelta(minutes=15)

        user_collection.update_one(
            {"email": req.email.strip()},
            {
                "$set": {
                    "verification_otp": otp,
                    "otp_expiry": expiry
                }
            }
        )

        send_otp_email(user["email"], otp)
        return {"message": "Verification code resent successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
