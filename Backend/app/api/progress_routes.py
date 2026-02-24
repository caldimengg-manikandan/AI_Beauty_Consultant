from fastapi import APIRouter, Depends
from app.auth.jwt_handler import get_current_user
from app.mongodb.collections import analysis_collection
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/progress", tags=["Progress Tracker"])

@router.get("/comparison")
async def get_progress_comparison(current_user: dict = Depends(get_current_user)):
    """Compare the latest scan with the first scan to track progress."""
    email = current_user.get("sub")
    
    # Get all scans for user
    scans = list(analysis_collection.find({"user_email": email}).sort("created_at", 1))
    
    if len(scans) < 2:
        return {"can_compare": False, "message": "You need at least 2 scans to track progress."}
    
    first = scans[0]
    latest = scans[-1]
    
    # Calculate difference in key scores
    comparison = {}
    for score_key in ["acne", "oiliness", "texture"]:
        f_val = first.get("skin_scores", {}).get(score_key, 0)
        l_val = latest.get("skin_scores", {}).get(score_key, 0)
        
        # Improvement means score decreased (closer to 0 is better for these)
        diff = f_val - l_val
        improvement_pct = diff * 100
        
        comparison[score_key] = {
            "initial": round(f_val * 100, 1),
            "current": round(l_val * 100, 1),
            "improvement": round(improvement_pct, 1),
            "status": "improved" if improvement_pct > 0 else "declined" if improvement_pct < 0 else "stable"
        }
        
    return {
        "can_compare": True,
        "first_scan_date": first.get("created_at"),
        "latest_scan_date": latest.get("created_at"),
        "metrics": comparison
    }

@router.get("/timeline")
async def get_skin_timeline(current_user: dict = Depends(get_current_user)):
    """Get a 30-day timeline of skin health scores."""
    email = current_user.get("sub")
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    scans = list(analysis_collection.find({
        "user_email": email,
        "created_at": {"$gte": thirty_days_ago}
    }).sort("created_at", 1))
    
    timeline = []
    for scan in scans:
        timeline.append({
            "date": scan.get("created_at").strftime("%Y-%m-%d"),
            "scores": scan.get("skin_scores", {})
        })
        
    return timeline
