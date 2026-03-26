from fastapi import APIRouter, Depends, HTTPException
from app.auth.jwt_handler import get_current_user
from app.auth.rbac import ROLE_ADMIN, require_role, log_admin_action
from app.mongodb.user_collection import user_collection
from app.mongodb.collections import analysis_collection, db
from app.mongodb.settings_collection import settings_collection
from app.schemas.settings import UserSettings
from datetime import datetime

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/users")
async def get_all_users(current_user: dict = Depends(require_role([ROLE_ADMIN]))):
    """Admin view: List all registered users and their roles."""
    users = list(user_collection.find({}, {"password": 0, "_id": 0}))
    return users

@router.post("/update-role")
async def update_user_role(target_email: str, new_role: str, current_user: dict = Depends(require_role([ROLE_ADMIN]))):
    """Admin tool: Change a user's role (admin, expert, premium, user)."""
    print(f"🛠️ ADMIN: Updating role for {target_email} to {new_role}")
    valid_roles = ["admin", "expert", "premium", "user"]
    if new_role not in valid_roles:
        print(f"❌ ADMIN: Invalid role {new_role}")
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = user_collection.update_one(
        {"email": target_email},
        {"$set": {"role": new_role}}
    )
    
    if result.matched_count == 0:
        print(f"❌ ADMIN: User {target_email} not found")
        raise HTTPException(status_code=404, detail="User not found")
        
    log_admin_action(current_user["sub"], "UPDATE_ROLE", target_email, {"new_role": new_role})
    print(f"✅ ADMIN: Role updated for {target_email}")
    return {"message": f"Successfully updated {target_email} to {new_role}"}

@router.post("/update-status")
async def update_user_status(target_email: str, status: str, current_user: dict = Depends(require_role([ROLE_ADMIN]))):
    """Admin tool: Block or activate a user account."""
    print(f"🛠️ ADMIN: Updating status for {target_email} to {status}")
    if status not in ["active", "blocked"]:
        print(f"❌ ADMIN: Invalid status {status}")
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = user_collection.update_one(
        {"email": target_email},
        {"$set": {"status": status}}
    )
    
    if result.matched_count == 0:
        print(f"❌ ADMIN: User {target_email} not found")
        raise HTTPException(status_code=404, detail="User not found")
        
    log_admin_action(current_user["sub"], "UPDATE_STATUS", target_email, {"new_status": status})
    print(f"✅ ADMIN: Status updated for {target_email}")
    return {"message": f"Successfully updated {target_email} to {status}"}

@router.get("/stats")
async def get_system_stats(current_user: dict = Depends(require_role([ROLE_ADMIN]))):
    """Admin Dashboard: Global metrics for the platform."""
    total_users = user_collection.count_documents({})
    total_analyses = analysis_collection.count_documents({})
    
    # Analyze face shape trends with normalization to handle mixed data types
    pipeline = [
        {
            "$project": {
                "normalized_shape": {
                    "$cond": {
                        "if": {"$eq": [{"$type": "$face_shape"}, "string"]},
                        "then": "$face_shape",
                        "else": {
                            "$cond": {
                                "if": {"$eq": [{"$type": "$face_shape"}, "object"]},
                                "then": "$face_shape.value",
                                "else": {
                                    "$cond": {
                                        "if": {"$eq": [{"$type": "$face_shape"}, "array"]},
                                        "then": {"$arrayElemAt": ["$face_shape", 0]},
                                        "else": "Unknown"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        {"$group": {
            "_id": "$normalized_shape",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}}
    ]
    face_shape_trends = list(analysis_collection.aggregate(pipeline))
    
    return {
        "status": "Healthy",
        "total_users": total_users,
        "total_analyses": total_analyses,
        "face_shape_trends": face_shape_trends,
        "timestamp": datetime.utcnow()
    }

@router.get("/audit-logs")
async def get_audit_logs(current_user: dict = Depends(require_role([ROLE_ADMIN]))):
    """View system-wide administrative actions."""
    logs = list(db["audit_logs"].find().sort("timestamp", -1).limit(50))
    for log in logs:
        log["_id"] = str(log["_id"])
    return logs

@router.post("/broadcast")
async def create_announcement(message: str, current_user: dict = Depends(require_role([ROLE_ADMIN]))):
    """Admin tool: Send a global notification/announcement to all users."""
    announcement = {
        "admin_email": current_user["sub"],
        "message": message,
        "timestamp": datetime.utcnow(),
        "type": "global_broadcast"
    }
    db["announcements"].insert_one(announcement)
    log_admin_action(current_user["sub"], "CREATE_BROADCAST", "ALL", {"message": message})
    return {"message": "Announcement broadcasted successfully"}

@router.get("/user-settings/{target_email}")
async def get_target_user_settings(target_email: str, current_user: dict = Depends(require_role([ROLE_ADMIN]))):
    """Admin tool: View any user's preferences/settings."""
    settings = settings_collection.find_one({"user_email": target_email})
    if not settings:
        # Return defaults if not found
        return {"user_email": target_email, "message": "Using default settings"}
    
    settings["_id"] = str(settings["_id"])
    return settings

@router.post("/user-settings/{target_email}")
async def update_target_user_settings(target_email: str, settings_data: UserSettings, current_user: dict = Depends(require_role([ROLE_ADMIN]))):
    """Admin tool: Directly modify a user's settings."""
    settings_dict = settings_data.dict()
    settings_dict["user_email"] = target_email  # Force correct email
    settings_dict["updated_at"] = datetime.utcnow()
    
    result = settings_collection.update_one(
        {"user_email": target_email},
        {"$set": settings_dict},
        upsert=True
    )
    
    log_admin_action(current_user["sub"], "UPDATE_USER_SETTINGS", target_email, {"action": "administrative_override"})
    return {"message": f"Settings for {target_email} updated successfully"}

@router.delete("/analysis/{analysis_id}")
async def delete_user_analysis(analysis_id: str, current_user: dict = Depends(require_role([ROLE_ADMIN]))):
    """Admin tool: Delete any analysis record (e.g. for offensive content or errors)."""
    from bson import ObjectId
    import os
    
    # 1. Find the analysis to get image paths
    try:
        obj_id = ObjectId(analysis_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid analysis ID format")

    analysis = analysis_collection.find_one({"_id": obj_id})
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    # 2. Delete images from disk
    try:
        for img_key in ["image_url", "annotated_image_url"]:
            if img_key in analysis:
                filename = analysis[img_key].split("/")[-1]
                local_path = os.path.join("static/uploads", filename)
                if os.path.exists(local_path):
                    os.remove(local_path)
    except Exception as e:
        print(f"⚠️ Failed to delete files for analysis {analysis_id}: {e}")

    # 3. Delete from DB
    analysis_collection.delete_one({"_id": obj_id})
    
    log_admin_action(current_user["sub"], "DELETE_ANALYSIS", str(analysis.get("user_email")), {"analysis_id": analysis_id})
    return {"message": "Analysis record and associated files deleted successfully"}
