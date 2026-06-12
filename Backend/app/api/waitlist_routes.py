from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from typing import List, Dict
from datetime import datetime
from pydantic import BaseModel
import uuid
import json

from app.auth.jwt_handler import get_current_user
from app.mongodb.collections import waitlist_collection, salons_collection

router = APIRouter(prefix="/api/waitlist", tags=["Live Operations & Waitlist"])

# WebSocket Connection Manager for real-time broadcasts
class WaitlistConnectionManager:
    def __init__(self):
        # Maps salon_id -> list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, salon_id: str):
        await websocket.accept()
        if salon_id not in self.active_connections:
            self.active_connections[salon_id] = []
        self.active_connections[salon_id].append(websocket)

    def disconnect(self, websocket: WebSocket, salon_id: str):
        if salon_id in self.active_connections and websocket in self.active_connections[salon_id]:
            self.active_connections[salon_id].remove(websocket)

    async def broadcast_update(self, salon_id: str, message: dict):
        if salon_id in self.active_connections:
            for connection in self.active_connections[salon_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    pass

manager = WaitlistConnectionManager()

# Models
class WaitlistEntryCreate(BaseModel):
    customer_name: str
    service_name: str
    estimated_duration: int = 30 # minutes

class WaitlistStatusUpdate(BaseModel):
    status: str # waiting | seated | completed | cancelled

def _get_owner_salon(current_user: dict):
    salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")})
    if not salon:
        raise HTTPException(status_code=404, detail="No salon found for this account")
    return salon

# ── WebSocket Route ──────────────────────────────────────────────────────────

@router.websocket("/ws/{salon_id}")
async def waitlist_websocket(websocket: WebSocket, salon_id: str):
    """
    Connect to this endpoint via ws:// to receive real-time waitlist updates.
    """
    await manager.connect(websocket, salon_id)
    try:
        while True:
            # Just keep the connection alive, we only broadcast FROM the server based on REST triggers
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, salon_id)

# ── REST Routes ──────────────────────────────────────────────────────────────

@router.get("/")
async def get_waitlist(current_user: dict = Depends(get_current_user)):
    """Get the current live waitlist for the owner's salon."""
    salon = _get_owner_salon(current_user)
    salon_id = salon["id"]
    
    # Get active waitlist entries today
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    cursor = waitlist_collection.find({
        "salon_id": salon_id,
        "created_at": {"$gte": today}
    }).sort("created_at", 1)
    
    entries = list(cursor)
    for e in entries:
        e.pop("_id", None)
        
    return entries

@router.post("/add")
async def add_to_waitlist(entry: WaitlistEntryCreate, current_user: dict = Depends(get_current_user)):
    """Add a walk-in to the waitlist."""
    salon = _get_owner_salon(current_user)
    salon_id = salon["id"]
    
    new_entry = {
        "id": str(uuid.uuid4()),
        "salon_id": salon_id,
        "customer_name": entry.customer_name,
        "service_name": entry.service_name,
        "status": "waiting",
        "estimated_duration": entry.estimated_duration,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    waitlist_collection.insert_one(new_entry)
    new_entry.pop("_id", None)
    
    # Broadcast to all connected WebSockets in this salon
    await manager.broadcast_update(salon_id, {"type": "NEW_ENTRY", "data": new_entry})
    
    return {"status": "success", "data": new_entry}

@router.put("/{entry_id}/status")
async def update_waitlist_status(entry_id: str, update: WaitlistStatusUpdate, current_user: dict = Depends(get_current_user)):
    """Update status (e.g. seated, completed) and broadcast to WebSocket."""
    salon = _get_owner_salon(current_user)
    salon_id = salon["id"]
    
    existing = waitlist_collection.find_one({"id": entry_id, "salon_id": salon_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Entry not found")
        
    waitlist_collection.update_one(
        {"id": entry_id},
        {"$set": {"status": update.status, "updated_at": datetime.utcnow().isoformat()}}
    )
    
    updated_entry = waitlist_collection.find_one({"id": entry_id})
    updated_entry.pop("_id", None)
    
    # Broadcast change
    await manager.broadcast_update(salon_id, {"type": "UPDATE_STATUS", "data": updated_entry})
    
    return {"status": "success", "data": updated_entry}
