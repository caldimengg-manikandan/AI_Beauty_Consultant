from fastapi import APIRouter, Depends, HTTPException
from app.auth.jwt_handler import get_current_user
from app.auth.rbac import ROLE_EXPERT, require_role
from app.mongodb.collections import analysis_collection, db
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/expert", tags=["Expert"])

class ExpertReviewRequest(BaseModel):
    analysis_id: str
    expert_tip: str
    is_accurate: bool
    prescribed_products: Optional[List[str]] = []

@router.get("/review-queue")
async def get_review_queue(current_user: dict = Depends(require_role([ROLE_EXPERT]))):
    """Experts view: Queue of recent analyses waiting for human validation."""
    # Find analyses that don't have expert_review yet
    queue = list(analysis_collection.find({"expert_review": {"$exists": False}}).sort("created_at", -1).limit(20))
    for item in queue:
        item["id"] = str(item["_id"])
        del item["_id"]
    return queue

@router.post("/submit-review")
async def submit_expert_review(review: ExpertReviewRequest, current_user: dict = Depends(require_role([ROLE_EXPERT]))):
    """Experts tool: Add a professional human layer to AI diagnosis."""
    from bson import ObjectId
    
    review_doc = {
        "expert_email": current_user["sub"],
        "expert_tip": review.expert_tip,
        "is_accurate": review.is_accurate,
        "prescribed_products": review.prescribed_products,
        "reviewed_at": datetime.utcnow()
    }
    
    result = analysis_collection.update_one(
        {"_id": ObjectId(review.analysis_id)},
        {"$set": {"expert_review": review_doc}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Analysis record not found")
        
    return {"message": "Professional review submitted successfully"}
