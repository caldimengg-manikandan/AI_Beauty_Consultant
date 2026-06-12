from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List
from datetime import datetime
from pydantic import BaseModel
import uuid
import secrets
import httpx

from app.auth.jwt_handler import get_current_user
from app.mongodb.collections import webhooks_collection, api_keys_collection, salons_collection

router = APIRouter(prefix="/api/developers", tags=["Developer API & Webhooks"])

# ── Models ────────────────────────────────────────────────────────────────────

class WebhookRegister(BaseModel):
    url: str
    events: List[str] # booking.created, payment.success, customer.registered, etc.
    secret: str = None # Optional secret for payload signing (HMAC)

# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_owner_salon(current_user: dict):
    salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")})
    if not salon:
        raise HTTPException(status_code=404, detail="No salon found for this account")
    return salon

async def dispatch_webhook(url: str, payload: dict, secret: str = None):
    """Background task to POST payload to a registered webhook URL."""
    headers = {"Content-Type": "application/json"}
    if secret:
        # In production, compute HMAC-SHA256 signature here and attach as header
        headers["X-Salon-Signature"] = "mock_signature"
        
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(url, json=payload, headers=headers)
            # Log success to DB in real implementation
    except Exception as e:
        # Log failure and potentially schedule retry in real implementation
        print(f"Webhook delivery failed for {url}: {e}")

# ── API Keys ──────────────────────────────────────────────────────────────────

@router.get("/keys")
async def get_api_keys(current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)
    keys = list(api_keys_collection.find({"salon_id": salon["id"]}).sort("created_at", -1))
    for k in keys:
        k.pop("_id", None)
        # Obfuscate secret key for security (only show first and last 4 chars)
        k["secret_key"] = f"{k['secret_key'][:6]}...{k['secret_key'][-4:]}"
    return keys

@router.post("/keys/generate")
async def generate_api_key(current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)
    
    # Generate secure random prefix and secret
    client_id = f"sk_live_{secrets.token_hex(12)}"
    
    new_key = {
        "id": str(uuid.uuid4()),
        "salon_id": salon["id"],
        "name": f"API Key - {datetime.utcnow().strftime('%b %d, %Y')}",
        "secret_key": client_id,
        "is_active": True,
        "last_used": None,
        "created_at": datetime.utcnow().isoformat()
    }
    
    api_keys_collection.insert_one(new_key)
    new_key.pop("_id", None)
    
    # We return the full secret key ONLY ONCE here.
    return {"status": "success", "message": "Key generated. Save this secret, it will not be shown again.", "data": new_key}

@router.delete("/keys/{key_id}")
async def revoke_api_key(key_id: str, current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)
    res = api_keys_collection.delete_one({"id": key_id, "salon_id": salon["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Key not found")
    return {"status": "success"}

# ── Webhooks ──────────────────────────────────────────────────────────────────

@router.get("/webhooks")
async def get_webhooks(current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)
    hooks = list(webhooks_collection.find({"salon_id": salon["id"]}).sort("created_at", -1))
    for h in hooks:
        h.pop("_id", None)
        if h.get("secret"):
            h["secret"] = "***" # Hide secret
    return hooks

@router.post("/webhooks/register")
async def register_webhook(hook: WebhookRegister, current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)
    
    if not hook.url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid Webhook URL. Must be http/https.")
        
    new_hook = {
        "id": str(uuid.uuid4()),
        "salon_id": salon["id"],
        "url": hook.url,
        "events": hook.events,
        "secret": hook.secret or secrets.token_urlsafe(16),
        "is_active": True,
        "last_triggered": None,
        "created_at": datetime.utcnow().isoformat()
    }
    
    webhooks_collection.insert_one(new_hook)
    new_hook.pop("_id", None)
    return {"status": "success", "data": new_hook}

@router.post("/webhooks/{hook_id}/test")
async def test_webhook(hook_id: str, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)
    hook = webhooks_collection.find_one({"id": hook_id, "salon_id": salon["id"]})
    
    if not hook:
        raise HTTPException(status_code=404, detail="Webhook not found")
        
    # Mock Payload
    payload = {
        "event_id": f"evt_{secrets.token_hex(8)}",
        "event_type": "ping",
        "created_at": datetime.utcnow().isoformat(),
        "data": {
            "message": "Hello from your AI Salon Webhook Gateway!",
            "salon_id": salon["id"]
        }
    }
    
    # Schedule HTTP POST in background
    background_tasks.add_task(dispatch_webhook, hook["url"], payload, hook.get("secret"))
    
    # Update last_triggered timestamp
    webhooks_collection.update_one({"id": hook_id}, {"$set": {"last_triggered": datetime.utcnow().isoformat()}})
    
    return {"status": "success", "message": "Test payload dispatched"}

@router.delete("/webhooks/{hook_id}")
async def delete_webhook(hook_id: str, current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)
    res = webhooks_collection.delete_one({"id": hook_id, "salon_id": salon["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Webhook not found")
    return {"status": "success"}
