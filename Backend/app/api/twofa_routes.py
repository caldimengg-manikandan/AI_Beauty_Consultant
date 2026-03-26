"""
Two-Factor Authentication API routes
"""
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from app.mongodb.user_collection import user_collection
from app.auth.jwt_handler import get_current_user
from app.auth.twofa import (
    generate_2fa_secret,
    generate_qr_code,
    verify_totp_code,
    generate_backup_codes,
    hash_backup_code,
    verify_backup_code
)
from datetime import datetime
from typing import List

router = APIRouter(prefix="/api/auth/2fa", tags=["Two-Factor Authentication"])


class Enable2FAResponse(BaseModel):
    qr_code: str
    secret: str
    backup_codes: List[str]


class Verify2FARequest(BaseModel):
    code: str


class Login2FARequest(BaseModel):
    email: str
    password: str
    totp_code: str


@router.post("/enable", response_model=Enable2FAResponse)
async def enable_2fa(current_user: dict = Depends(get_current_user)):
    """
    Enable 2FA for user account
    Returns QR code and backup codes
    """
    user_email = current_user.get("sub")
    
    # Get user from database
    user = user_collection.find_one({"email": user_email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if 2FA is already enabled
    if user.get("twofa_enabled"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is already enabled for this account"
        )
    
    # Generate secret
    secret = generate_2fa_secret()
    
    # Generate QR code
    qr_code = generate_qr_code(user_email, secret)
    
    # Generate backup codes
    backup_codes = generate_backup_codes(10)
    
    # Hash backup codes for storage
    hashed_backup_codes = [hash_backup_code(code) for code in backup_codes]
    
    # Store secret and backup codes (but don't enable yet - wait for verification)
    user_collection.update_one(
        {"email": user_email},
        {
            "$set": {
                "twofa_secret": secret,
                "twofa_backup_codes": hashed_backup_codes,
                "twofa_setup_at": datetime.utcnow()
            }
        }
    )
    
    return Enable2FAResponse(
        qr_code=qr_code,
        secret=secret,
        backup_codes=backup_codes
    )


@router.post("/verify")
async def verify_and_activate_2fa(
    request: Verify2FARequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Verify TOTP code and activate 2FA
    """
    user_email = current_user.get("sub")
    
    # Get user from database
    user = user_collection.find_one({"email": user_email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get secret
    secret = user.get("twofa_secret")
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA setup not initiated. Please enable 2FA first."
        )
    
    # Verify code
    if not verify_totp_code(secret, request.code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid verification code"
        )
    
    # Activate 2FA
    user_collection.update_one(
        {"email": user_email},
        {
            "$set": {
                "twofa_enabled": True,
                "twofa_activated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": "2FA enabled successfully",
        "enabled": True
    }


@router.post("/disable")
async def disable_2fa(
    request: Verify2FARequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Disable 2FA (requires TOTP code verification)
    """
    user_email = current_user.get("sub")
    
    # Get user from database
    user = user_collection.find_one({"email": user_email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.get("twofa_enabled"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled for this account"
        )
    
    # Verify code
    secret = user.get("twofa_secret")
    if not verify_totp_code(secret, request.code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid verification code"
        )
    
    # Disable 2FA and remove secrets
    user_collection.update_one(
        {"email": user_email},
        {
            "$set": {
                "twofa_enabled": False,
                "twofa_disabled_at": datetime.utcnow()
            },
            "$unset": {
                "twofa_secret": "",
                "twofa_backup_codes": ""
            }
        }
    )
    
    return {
        "message": "2FA disabled successfully",
        "enabled": False
    }


@router.get("/status")
async def get_2fa_status(current_user: dict = Depends(get_current_user)):
    """
    Get 2FA status for current user
    """
    user_email = current_user.get("sub")
    
    user = user_collection.find_one({"email": user_email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "enabled": user.get("twofa_enabled", False),
        "activated_at": user.get("twofa_activated_at"),
        "backup_codes_remaining": len(user.get("twofa_backup_codes", []))
    }


@router.post("/backup-codes/regenerate")
async def regenerate_backup_codes(
    request: Verify2FARequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Regenerate backup codes (requires TOTP verification)
    """
    user_email = current_user.get("sub")
    
    user = user_collection.find_one({"email": user_email})
    
    if not user or not user.get("twofa_enabled"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled"
        )
    
    # Verify code
    secret = user.get("twofa_secret")
    if not verify_totp_code(secret, request.code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid verification code"
        )
    
    # Generate new backup codes
    backup_codes = generate_backup_codes(10)
    hashed_backup_codes = [hash_backup_code(code) for code in backup_codes]
    
    # Update database
    user_collection.update_one(
        {"email": user_email},
        {
            "$set": {
                "twofa_backup_codes": hashed_backup_codes,
                "backup_codes_regenerated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": "Backup codes regenerated successfully",
        "backup_codes": backup_codes
    }
