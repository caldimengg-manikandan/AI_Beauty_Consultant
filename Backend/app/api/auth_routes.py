




# from fastapi import APIRouter, HTTPException, Depends
# from fastapi.security import OAuth2PasswordRequestForm

# from app.mongodb.user_collection import user_collection
# from app.auth.security import hash_password, verify_password
# from app.auth.jwt_handler import create_access_token

# router = APIRouter(prefix="/auth", tags=["Auth"])


# @router.post("/signup")
# def signup(user: dict):
#     email = user.get("email")
#     password = user.get("password")

#     if not email or not password:
#         raise HTTPException(status_code=400, detail="Email and password required")

#     if user_collection.find_one({"email": email}):
#         raise HTTPException(status_code=400, detail="User already exists")

#     user_doc = {
#         "email": email,
#         "password": hash_password(password),
#         "role": "user"
#     }

#     user_collection.insert_one(user_doc)

#     return {"message": "User registered successfully"}


# @router.post("/login")
# def login(form_data: OAuth2PasswordRequestForm = Depends()):
#     user = user_collection.find_one({"email": form_data.username})

#     if not user:
#         raise HTTPException(status_code=401, detail="Invalid credentials")

#     if not verify_password(form_data.password, user["password"]):
#         raise HTTPException(status_code=401, detail="Invalid credentials")

#     token = create_access_token({
#         "sub": user["email"],
#         "role": user["role"]
#     })

#     return {
#         "access_token": token,
#         "token_type": "bearer"
#     }



from fastapi import APIRouter, HTTPException, Depends
from app.auth.jwt_handler import get_current_user
from app.mongodb.user_collection import user_collection
from app.auth.security import hash_password, verify_password
from app.auth.jwt_handler import create_access_token
from app.auth.schemas import UserAuth

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/signup")
def signup(user: UserAuth):
    try:
        if user_collection.find_one({"email": user.email}):
            raise HTTPException(status_code=400, detail="User already exists")

        raw_password = user.password.strip()

        print(f"DEBUG: Hashing password for {user.email}")
        hashed = hash_password(raw_password)
        print(f"DEBUG: Password hashed: {hashed[:10]}...")

        user_doc = {
            "email": user.email,
            "password": hashed,
            "role": "user"
        }

        print("DEBUG: Inserting user into MongoDB")
        user_collection.insert_one(user_doc)
        print("DEBUG: Signup successful")
        return {"message": "User registered successfully"}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"CRITICAL ERROR IN SIGNUP: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login")
def login(user: UserAuth):
    try:
        print(f"DEBUG: Login attempt for {user.email}")
        db_user = user_collection.find_one({"email": user.email})
        if not db_user:
            print(f"DEBUG: User {user.email} not found")
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Strip password on login to match signup behavior
        raw_password = user.password.strip()

        if not verify_password(raw_password, db_user["password"]):
            print(f"DEBUG: Password mismatch for {user.email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = create_access_token({
            "sub": db_user["email"],
            "role": db_user["role"]
        })

        print(f"DEBUG: Login successful for {user.email}")
        return {
            "access_token": token,
            "token_type": "bearer"
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"CRITICAL ERROR IN LOGIN: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete-account")
def delete_account(current_user: dict = Depends(get_current_user)):
    user_email = current_user.get("sub")
    
    # 1. Delete user settings
    from app.mongodb.settings_collection import settings_collection
    settings_collection.delete_one({"user_email": user_email})
    
    # 2. Delete user analysis history
    from app.mongodb.collections import analysis_collection
    analysis_collection.delete_many({"user_email": user_email})
    
    # 3. Delete user account
    result = user_collection.delete_one({"email": user_email})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"message": "Account and all associated data deleted successfully"}
