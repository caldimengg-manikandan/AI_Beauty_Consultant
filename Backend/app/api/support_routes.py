"""
Support Ticket Routes — All Roles
Customer: create/view tickets
Salon Owner: create/view tickets
Admin: view all, respond, resolve, escalate
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.mongodb.collections import support_tickets_collection, users_collection
from app.auth.jwt_handler import get_current_user
import uuid

router = APIRouter(prefix="/api/support", tags=["Support Tickets"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class TicketCreate(BaseModel):
    subject: str
    category: str       # booking | payment | salon | technical | refund | other
    priority: str = "medium"  # low | medium | high | urgent
    description: str
    booking_id: Optional[str] = None
    salon_id: Optional[str] = None
    attachments: List[str] = []  # URLs

class TicketReply(BaseModel):
    message: str
    is_internal: bool = False   # True = only visible to support team


# ── Customer / Owner — Create Tickets ─────────────────────────────────────────

@router.post("/create")
async def create_ticket(ticket: TicketCreate, current_user: dict = Depends(get_current_user)):
    user_id  = current_user.get("sub")
    user_doc = users_collection.find_one({"email": user_id}) or {}
    ticket_id = f"TKT-{str(uuid.uuid4().hex[:8]).upper()}"
    new_ticket = {
        "id": str(uuid.uuid4()),
        "ticket_id": ticket_id,
        "user_id": user_id,
        "user_name": user_doc.get("name", user_id),
        "user_role": current_user.get("role", "user"),
        "status": "open",       # open | in_progress | resolved | closed
        "replies": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "resolved_at": None,
        "assigned_to": None,
        **ticket.dict()
    }
    support_tickets_collection.insert_one(new_ticket)
    new_ticket.pop("_id", None)
    return {
        "status": "success",
        "ticket_id": ticket_id,
        "message": f"Ticket #{ticket_id} created. Our team will respond within 24 hours.",
        "data": new_ticket
    }


@router.get("/my-tickets")
async def get_my_tickets(
    status: str = Query(None),
    category: str = Query(None),
    current_user: dict = Depends(get_current_user)
):
    query = {"user_id": current_user.get("sub")}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    tickets = list(support_tickets_collection.find(query).sort("created_at", -1))
    for t in tickets:
        t.pop("_id", None)
    return {"tickets": tickets, "total": len(tickets)}


@router.get("/{ticket_id}")
async def get_ticket_detail(ticket_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    ticket  = support_tickets_collection.find_one({"id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    # Customers can only see their own tickets; admins see all
    if current_user.get("role") != "admin" and ticket.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    ticket.pop("_id", None)
    return ticket


@router.post("/{ticket_id}/reply")
async def reply_to_ticket(ticket_id: str, reply: TicketReply, current_user: dict = Depends(get_current_user)):
    ticket = support_tickets_collection.find_one({"id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    user_id = current_user.get("sub")
    # Only ticket owner or admin can reply
    if current_user.get("role") != "admin" and ticket.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if ticket.get("status") == "closed":
        raise HTTPException(status_code=400, detail="Cannot reply to a closed ticket")

    user_doc = users_collection.find_one({"email": user_id}) or {}
    reply_entry = {
        "id": str(uuid.uuid4()),
        "author_id": user_id,
        "author_name": user_doc.get("name", user_id),
        "author_role": current_user.get("role", "user"),
        "message": reply.message,
        "is_internal": reply.is_internal and current_user.get("role") == "admin",
        "timestamp": datetime.utcnow()
    }
    new_status = "in_progress" if current_user.get("role") == "admin" else ticket.get("status")

    support_tickets_collection.update_one(
        {"id": ticket_id},
        {
            "$push": {"replies": reply_entry},
            "$set": {"updated_at": datetime.utcnow(), "status": new_status}
        }
    )
    return {"status": "success", "message": "Reply sent", "reply": reply_entry}


# ── Admin — Manage All Tickets ────────────────────────────────────────────────

@router.get("/admin/all")
async def admin_all_tickets(
    status: str = Query(None),
    category: str = Query(None),
    priority: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    query: dict = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if priority:
        query["priority"] = priority

    skip = (page - 1) * limit
    tickets = list(support_tickets_collection.find(query).sort("created_at", -1).skip(skip).limit(limit))
    total   = support_tickets_collection.count_documents(query)
    for t in tickets:
        t.pop("_id", None)
    return {"tickets": tickets, "total": total, "page": page, "pages": -(-total // limit)}


@router.patch("/admin/{ticket_id}/status")
async def update_ticket_status(
    ticket_id: str,
    status: str,
    assigned_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    if status not in ["open", "in_progress", "resolved", "closed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    update = {
        "status": status,
        "updated_at": datetime.utcnow(),
        "updated_by": current_user.get("sub")
    }
    if status == "resolved":
        update["resolved_at"] = datetime.utcnow()
    if assigned_to:
        update["assigned_to"] = assigned_to
    result = support_tickets_collection.update_one({"id": ticket_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"status": "success", "message": f"Ticket {status}"}


@router.get("/admin/stats")
async def support_stats(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    total     = support_tickets_collection.count_documents({})
    open_t    = support_tickets_collection.count_documents({"status": "open"})
    progress  = support_tickets_collection.count_documents({"status": "in_progress"})
    resolved  = support_tickets_collection.count_documents({"status": "resolved"})
    urgent    = support_tickets_collection.count_documents({"priority": "urgent", "status": {"$in": ["open", "in_progress"]}})
    return {
        "total": total,
        "open": open_t,
        "in_progress": progress,
        "resolved": resolved,
        "urgent_unresolved": urgent,
        "resolution_rate": round((resolved / total * 100) if total else 0, 1)
    }
