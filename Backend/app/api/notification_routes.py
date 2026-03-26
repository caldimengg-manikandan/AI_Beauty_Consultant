"""
Notification & Weekly Report API Routes
Handles scheduled emails and user notification preferences
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.auth.jwt_handler import get_current_user
from app.mongodb.client import db
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional
import os

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

notification_logs = db["notification_logs"]
user_prefs = db["notification_preferences"]

class NotificationSettings(BaseModel):
    email_enabled: bool = True
    weekly_report: bool = True
    routine_reminders: bool = True
    product_pips: bool = True

@router.get("/settings")
async def get_notification_settings(current_user: dict = Depends(get_current_user)):
    user_email = current_user.get("sub")
    prefs = user_prefs.find_one({"user_email": user_email})
    if not prefs:
        return NotificationSettings()
    prefs.pop("_id", None)
    return prefs

@router.post("/settings")
async def update_notification_settings(settings: NotificationSettings, current_user: dict = Depends(get_current_user)):
    user_email = current_user.get("sub")
    user_prefs.update_one(
        {"user_email": user_email},
        {"$set": settings.dict(), "$setONInsert": {"created_at": datetime.utcnow()}},
        upsert=True
    )
    return {"success": True, "message": "Notification preferences updated"}

@router.post("/test-email")
async def send_test_email(background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    """Triggers a test email to the user (Mock implementation)"""
    user_email = current_user.get("sub")
    
    # In production, we would use a real mailer like fastapi-mail or smtplib
    # For now, we'll log the action and return success
    background_tasks.add_task(mock_send_email, user_email, "Welcome to AI Beauty Consultant!", "Your personalized beauty journey starts here.")
    
    return {"success": True, "message": f"Test email queued for {user_email}"}

async def mock_send_email(to_email: str, subject: str, body: str):
    print(f"📧 [MOCK EMAIL] Sending to: {to_email}")
    print(f"📧 [MOCK EMAIL] Subject: {subject}")
    print(f"📧 [MOCK EMAIL] Body: {body}")
    
    # Log to DB
    notification_logs.insert_one({
        "user_email": to_email,
        "type": "email",
        "subject": subject,
        "sent_at": datetime.utcnow(),
        "status": "delivered (mock)"
    })

# --- APScheduler Background Task (Conceptual) ---
# In a real app, this would be initialized in main.py
def send_weekly_reports():
    """Logic to iterate over users and send their weekly progress reports"""
    # 1. Fetch all users with weekly_report=True
    # 2. For each, calculate progress from analysis_collection
    # 3. Generate summary and send email
    pass
