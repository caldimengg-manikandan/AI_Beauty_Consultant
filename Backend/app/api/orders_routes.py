"""
Orders Management Routes — Customer Product Orders
Handles: cart checkout → order creation → order tracking → cancellation
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

from app.auth.jwt_handler import get_current_user
from app.mongodb.collections import orders_collection, db

router = APIRouter(prefix="/api/orders", tags=["Orders"])

products_collection = db["products"]  # e-commerce product catalog

# ── Schemas ───────────────────────────────────────────────────────────────────

class OrderItem(BaseModel):
    product_id: str
    name: str
    quantity: int
    price: float
    image_url: Optional[str] = None

class CreateOrderRequest(BaseModel):
    items: List[OrderItem]
    delivery_address: str
    delivery_city: str
    delivery_pincode: str
    payment_method: str = "cod"   # cod | razorpay | upi
    coupon_code: Optional[str] = None
    notes: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str  # pending | confirmed | processing | shipped | delivered | cancelled

# ── Helpers ───────────────────────────────────────────────────────────────────

def _strip(doc):
    if doc:
        doc.pop("_id", None)
    return doc

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/create")
async def create_order(req: CreateOrderRequest, current_user: dict = Depends(get_current_user)):
    """Create a new product order from cart items."""
    if not req.items:
        raise HTTPException(status_code=400, detail="Order must have at least one item")

    subtotal = sum(item.price * item.quantity for item in req.items)
    delivery_fee = 0.0 if subtotal >= 499 else 49.0   # Free delivery above ₹499
    grand_total = subtotal + delivery_fee

    # Apply coupon discount (simple flat 10% if valid)
    discount = 0.0
    if req.coupon_code:
        discount = round(subtotal * 0.10, 2)
        grand_total = max(0, grand_total - discount)

    order_ref = "ORD-" + uuid.uuid4().hex[:8].upper()
    new_order = {
        "id": str(uuid.uuid4()),
        "order_ref": order_ref,
        "user_id": current_user.get("sub"),
        "items": [item.dict() for item in req.items],
        "subtotal": round(subtotal, 2),
        "delivery_fee": delivery_fee,
        "discount": discount,
        "grand_total": round(grand_total, 2),
        "delivery_address": req.delivery_address,
        "delivery_city": req.delivery_city,
        "delivery_pincode": req.delivery_pincode,
        "payment_method": req.payment_method,
        "payment_status": "pending" if req.payment_method == "cod" else "awaiting_payment",
        "status": "pending",
        "notes": req.notes,
        "coupon_code": req.coupon_code,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "estimated_delivery": "3-5 business days"
    }

    orders_collection.insert_one(new_order)
    new_order.pop("_id", None)

    return {
        "status": "success",
        "message": f"Order placed! Your order ID is {order_ref}",
        "order_ref": order_ref,
        "data": new_order
    }


@router.get("/my-orders")
async def get_my_orders(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=50),
    current_user: dict = Depends(get_current_user)
):
    """Get the current user's order history."""
    query = {"user_id": current_user.get("sub")}
    if status:
        query["status"] = status

    skip = (page - 1) * limit
    orders = list(orders_collection.find(query).sort("created_at", -1).skip(skip).limit(limit))
    total = orders_collection.count_documents(query)

    return {
        "orders": [_strip(o) for o in orders],
        "total": total,
        "page": page,
        "pages": -(-total // limit)
    }


@router.get("/{order_id}")
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single order by ID or order_ref."""
    order = orders_collection.find_one({
        "$or": [{"id": order_id}, {"order_ref": order_id}],
        "user_id": current_user.get("sub")
    })
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _strip(order)


@router.patch("/{order_id}/cancel")
async def cancel_order(order_id: str, current_user: dict = Depends(get_current_user)):
    """Cancel a pending or confirmed order."""
    order = orders_collection.find_one({
        "$or": [{"id": order_id}, {"order_ref": order_id}],
        "user_id": current_user.get("sub")
    })
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.get("status") not in ["pending", "confirmed"]:
        raise HTTPException(status_code=400, detail="Only pending or confirmed orders can be cancelled")

    orders_collection.update_one(
        {"id": order.get("id")},
        {"$set": {"status": "cancelled", "updated_at": datetime.utcnow().isoformat()}}
    )
    return {"status": "success", "message": "Order cancelled successfully"}
