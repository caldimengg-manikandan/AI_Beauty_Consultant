from fastapi import APIRouter, Depends, HTTPException
from app.auth.jwt_handler import get_current_user
from app.mongodb.client import db
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/routine", tags=["Skincare Routine"])
routines_collection = db["user_routines"]

class RoutineProduct(BaseModel):
    product_name: str
    step: str # e.g., "Cleanser", "Toner", "Serum", "Moisturizer", "SPF"
    time: str # "AM", "PM", or "Both"
    instruction: Optional[str] = ""

class UserRoutine(BaseModel):
    user_email: str
    routine_name: str
    products: List[RoutineProduct]
    is_active: bool = True

@router.get("/")
async def get_my_routine(current_user: dict = Depends(get_current_user)):
    """Retrieve the user's current skincare routine."""
    email = current_user.get("sub")
    routine = routines_collection.find_one({"user_email": email, "is_active": True})
    if not routine:
        return {"message": "No active routine found", "products": []}
    
    routine["id"] = str(routine["_id"])
    del routine["_id"]
    return routine

@router.post("/build")
async def build_routine(routine_data: UserRoutine, current_user: dict = Depends(get_current_user)):
    """Save a new or updated routine."""
    email = current_user.get("sub")
    routine_dict = routine_data.dict()
    routine_dict["user_email"] = email
    routine_dict["updated_at"] = datetime.utcnow()
    
    # Deactivate old routines
    routines_collection.update_many({"user_email": email}, {"$set": {"is_active": False}})
    
    # Insert new routine
    routines_collection.insert_one(routine_dict)
    return {"status": "success", "message": "Routine built and activated!"}

@router.get("/recommendations")
async def get_routine_recommendations(current_user: dict = Depends(get_current_user)):
    """Smart feature: Suggest a routine based on the latest AI analysis."""
    from app.mongodb.collections import analysis_collection
    email = current_user.get("sub")
    
    last_scan = analysis_collection.find_one({"user_email": email}, sort=[("created_at", -1)])
    if not last_scan:
        raise HTTPException(status_code=404, detail="Please perform a face analysis first")
    
    skin_scores = last_scan.get("skin_scores", {})
    
    # Simple logic-based routine builder
    suggested_products = []
    
    # Step 1: Cleanser (Always)
    suggested_products.append({"step": "Cleanser", "product_name": "Gentle Oatmeal Cleanser", "time": "Both", "instruction": "Cleanse gently for 60 seconds."})
    
    # Step 2: Treatment based on scores
    if skin_scores.get("acne", 0) > 0.3:
         suggested_products.append({"step": "Serum", "product_name": "Sebum Control Serum", "time": "PM", "instruction": "Apply to active breakout areas."})
    
    # Step 3: Hydration
    if skin_scores.get("texture", 0) > 0.4:
         suggested_products.append({"step": "Moisturizer", "product_name": "Hyaluronic Cloud Hydrator", "time": "Both", "instruction": "Apply to damp skin."})
    
    # Step 4: Protection
    suggested_products.append({"step": "SPF", "product_name": "Broad Spectrum Protection", "time": "AM", "instruction": "Apply 2 finger lengths."})
    
    return {
        "analysis_date": last_scan.get("created_at"),
        "skin_type": last_scan.get("face_shape"), # Placeholder logic
        "suggested_routine": suggested_products
    }
