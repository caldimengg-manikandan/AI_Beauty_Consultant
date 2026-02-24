"""
Password management API routes
"""
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, validator
from app.mongodb.user_collection import user_collection
from app.auth.security import hash_password, verify_password
from app.auth.jwt_handler import get_current_user
from datetime import datetime
import re

router = APIRouter(prefix="/api/auth", tags=["Password Management"])


class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str
    
    @validator('new_password')
    def validate_password_strength(cls, v):
        """Validate password meets security requirements"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        """Ensure passwords match"""
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: dict = Depends(get_current_user)
):
    """Change user password"""
    user_email = current_user.get("sub")
    
    # Get user from database
    user = user_collection.find_one({"email": user_email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify current password
    if not verify_password(password_data.current_password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    # Check password history (prevent reuse of last 3 passwords)
    password_history = user.get("password_history", [])
    for old_password_hash in password_history[-3:]:
        if verify_password(password_data.new_password, old_password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot reuse one of your last 3 passwords"
            )
    
    # Hash new password
    new_password_hash = hash_password(password_data.new_password)
    
    # Update password history
    password_history.append(user["password"])
    if len(password_history) > 5:  # Keep last 5 passwords
        password_history = password_history[-5:]
    
    # Update user password
    user_collection.update_one(
        {"email": user_email},
        {
            "$set": {
                "password": new_password_hash,
                "password_history": password_history,
                "password_changed_at": datetime.utcnow()
            }
        }
    )
    
    # TODO: Send email notification about password change
    # send_password_change_email(user_email)
    
    return {
        "message": "Password changed successfully",
        "changed_at": datetime.utcnow().isoformat()
    }


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Request password reset"""
    # Check if user exists
    user = user_collection.find_one({"email": request.email})
    
    if not user:
        # Don't reveal if email exists or not (security best practice)
        return {
            "message": "If the email exists, a password reset link has been sent"
        }
    
    # TODO: Generate reset token and send email
    # reset_token = generate_reset_token(request.email)
    # send_password_reset_email(request.email, reset_token)
    
    return {
        "message": "If the email exists, a password reset link has been sent"
    }


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password with token"""
    # TODO: Verify reset token
    # user_email = verify_reset_token(request.token)
    
    # For now, return not implemented
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Password reset via email is not yet implemented. Please use change-password endpoint."
    )


@router.get("/password-strength/{password}")
async def check_password_strength(password: str):
    """Check password strength (for frontend validation)"""
    strength = {
        "score": 0,
        "feedback": []
    }
    
    if len(password) >= 8:
        strength["score"] += 20
    else:
        strength["feedback"].append("Use at least 8 characters")
    
    if len(password) >= 12:
        strength["score"] += 10
    
    if re.search(r'[A-Z]', password):
        strength["score"] += 20
    else:
        strength["feedback"].append("Add uppercase letters")
    
    if re.search(r'[a-z]', password):
        strength["score"] += 20
    else:
        strength["feedback"].append("Add lowercase letters")
    
    if re.search(r'\d', password):
        strength["score"] += 15
    else:
        strength["feedback"].append("Add numbers")
    
    if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        strength["score"] += 15
    else:
        strength["feedback"].append("Add special characters")
    
    # Determine strength level
    if strength["score"] >= 80:
        strength["level"] = "strong"
    elif strength["score"] >= 50:
        strength["level"] = "medium"
    else:
        strength["level"] = "weak"
    
    return strength
