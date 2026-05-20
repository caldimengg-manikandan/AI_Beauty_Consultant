from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime

from app.auth.jwt_handler import get_current_user
from app.auth.rbac import require_shop_owner
from app.mongodb.collections import custom_forms_collection, form_submissions_collection, salons_collection

router = APIRouter(
    prefix="/api/forms",
    tags=["Custom Form Builder & Intakes"],
    dependencies=[__import__('fastapi').Depends(require_shop_owner)]
)

class FormField(BaseModel):
    id: str
    label: str
    type: str # text | number | select | checkbox
    required: bool = False
    options: Optional[List[str]] = [] # for dropdown select

class FormTemplateCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    fields: List[FormField]

class FormSubmissionCreate(BaseModel):
    form_id: str
    customer_name: str
    customer_email: str
    responses: Dict[str, Any]

def _get_owner_salon(current_user: dict):
    salon = salons_collection.find_one({"owner_user_id": current_user.get("sub") or str(current_user["_id"])})
    if not salon:
        raise HTTPException(status_code=404, detail="No salon found for this account")
    return salon

@router.get("/templates")
async def get_my_templates(current_user: dict = Depends(get_current_user)):
    """Get all form templates created by the salon owner."""
    salon = _get_owner_salon(current_user)
    salon_id = str(salon["_id"])
    
    # Return templates
    cursor = custom_forms_collection.find({"salon_id": salon_id}).sort("created_at", -1)
    templates = list(cursor)
    for t in templates:
        t.pop("_id", None)
    return templates

@router.post("/templates")
async def create_template(req: FormTemplateCreate, current_user: dict = Depends(get_current_user)):
    """Create or update a form template."""
    salon = _get_owner_salon(current_user)
    salon_id = str(salon["_id"])
    
    template_id = str(uuid.uuid4())
    new_template = {
        "id": template_id,
        "salon_id": salon_id,
        "title": req.title,
        "description": req.description,
        "fields": [f.dict() for f in req.fields],
        "created_at": datetime.utcnow().isoformat()
    }
    
    custom_forms_collection.insert_one(new_template)
    new_template.pop("_id", None)
    return {"status": "success", "data": new_template}

@router.delete("/templates/{template_id}")
async def delete_template(template_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a form template."""
    salon = _get_owner_salon(current_user)
    salon_id = str(salon["_id"])
    
    res = custom_forms_collection.delete_one({"id": template_id, "salon_id": salon_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"status": "success", "message": "Template deleted"}

@router.post("/submit")
async def submit_responses(req: FormSubmissionCreate, current_user: dict = Depends(get_current_user)):
    """Submit responses to a form (by a customer or on behalf)."""
    # Verify form exists
    template = custom_forms_collection.find_one({"id": req.form_id})
    if not template:
        raise HTTPException(status_code=404, detail="Form template not found")
        
    submission_id = str(uuid.uuid4())
    new_sub = {
        "id": submission_id,
        "form_id": req.form_id,
        "salon_id": template["salon_id"],
        "form_title": template["title"],
        "customer_name": req.customer_name,
        "customer_email": req.customer_email,
        "responses": req.responses,
        "submitted_at": datetime.utcnow().isoformat()
    }
    
    form_submissions_collection.insert_one(new_sub)
    new_sub.pop("_id", None)
    return {"status": "success", "data": new_sub}

@router.get("/submissions")
async def get_my_submissions(current_user: dict = Depends(get_current_user)):
    """Get all submitted forms for the salon owner."""
    salon = _get_owner_salon(current_user)
    salon_id = str(salon["_id"])
    
    cursor = form_submissions_collection.find({"salon_id": salon_id}).sort("submitted_at", -1)
    subs = list(cursor)
    for s in subs:
        s.pop("_id", None)
    return subs
