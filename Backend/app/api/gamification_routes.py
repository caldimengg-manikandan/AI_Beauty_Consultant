"""
Gamification & Skin Health Score API
Handles score calculation, streaks, and achievement badges
"""
from fastapi import APIRouter, Depends
from app.auth.jwt_handler import get_current_user
from app.mongodb.collections import analysis_collection
from app.mongodb.client import db
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/gamification", tags=["Gamification"])

badges_collection = db["user_badges"]

def calculate_skin_health_score(skin_scores: dict) -> int:
    """Calculates a 0-100 score where 100 is perfect skin."""
    if not skin_scores:
        return 0
    
    # In our data, higher values usually mean higher concern (bad)
    # So score = 100 - average_concern
    concerns = ["acne", "oiliness", "texture", "dark_circles", "wrinkles", "redness"]
    values = [float(v) for k, v in skin_scores.items() if k in concerns]
    
    if not values:
        return 50 # Baseline
        
    avg_concern = sum(values) / len(values)
    score = 100 - (avg_concern * 100)
    return max(0, min(100, int(score)))

@router.get("/status")
async def get_gamification_status(current_user: dict = Depends(get_current_user)):
    email = current_user.get("sub")
    
    # 1. Calculate Streak
    scans = list(analysis_collection.find({"user_email": email}).sort("created_at", -1))
    
    streak = 0
    today = datetime.utcnow().date()
    
    if scans:
        last_scan_date = scans[0]["created_at"].date()
        if last_scan_date == today or last_scan_date == today - timedelta(days=1):
            streak = 1
            current_date = last_scan_date
            for s in scans[1:]:
                prev_date = s["created_at"].date()
                if prev_date == current_date - timedelta(days=1):
                    streak += 1
                    current_date = prev_date
                elif prev_date == current_date:
                    continue
                else:
                    break
    
    # 2. Latest Score
    latest_score = 0
    if scans:
        latest_score = calculate_skin_health_score(scans[0].get("skin_scores", {}))
        
    # 3. Badges (Check and Grant)
    user_badges = badges_collection.find_one({"user_email": email})
    if not user_badges:
        user_badges = {"user_email": email, "badges": []}
        badges_collection.insert_one(user_badges)
    
    current_badges = user_badges.get("badges", [])
    new_badges = []
    
    # Badge Logic
    if streak >= 7 and "7-Day Streak" not in current_badges:
        new_badges.append({"name": "7-Day Streak", "icon": "🔥", "date": datetime.utcnow()})
    if len(scans) >= 1 and "First Step" not in current_badges:
        new_badges.append({"name": "First Step", "icon": "🌱", "date": datetime.utcnow()})
    if latest_score > 80 and "Glow Master" not in current_badges:
        new_badges.append({"name": "Glow Master", "icon": "✨", "date": datetime.utcnow()})
        
    if new_badges:
        badges_collection.update_one(
            {"user_email": email},
            {"$push": {"badges": {"$each": new_badges}}}
        )
        current_badges.extend(new_badges)

    return {
        "streak": streak,
        "skin_health_score": latest_score,
        "badges": current_badges,
        "total_scans": len(scans)
    }
