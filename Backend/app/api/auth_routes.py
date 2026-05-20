from fastapi import APIRouter, HTTPException, Depends
from app.auth.jwt_handler import get_current_user
from app.mongodb.user_collection import user_collection
from app.auth.security import hash_password, verify_password
from app.auth.jwt_handler import create_access_token
from app.auth.schemas import UserAuth
from pydantic import BaseModel
from typing import Optional

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


# ─── Customer Signup ──────────────────────────────────────────────────────────
@router.post("/customer/signup")
def customer_signup(user: CustomerSignup):
    try:
        if user_collection.find_one({"email": user.email}):
            raise HTTPException(status_code=400, detail="Email already registered")

        hashed = hash_password(user.password.strip())
        user_doc = {
            "email": user.email,
            "password": hashed,
            "name": user.name,
            "phone": user.phone,
            "role": "user",
            "account_type": "customer",
            "created_at": __import__('datetime').datetime.utcnow(),
        }
        user_collection.insert_one(user_doc)
        return {"message": "Account created successfully! Please log in."}
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
            "created_at": __import__('datetime').datetime.utcnow(),
        }
        user_collection.insert_one(user_doc)
        return {"message": "Shop owner account created! Please log in to set up your salon."}
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
