"""
Invoice / POS Routes — Salon Partner B2B
Handles: invoice generation, GST calculation, payment tracking, export
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.mongodb.collections import (
    invoices_collection, salons_collection,
    slot_bookings_collection, users_collection
)
from app.auth.jwt_handler import get_current_user
from app.auth.rbac import require_shop_owner
import uuid

router = APIRouter(
    prefix="/api/invoices",
    tags=["Invoices & POS"],
    dependencies=[__import__('fastapi').Depends(require_shop_owner)]
)

GST_RATE = 0.18   # 18% default GST for beauty services


# ── Schemas ───────────────────────────────────────────────────────────────────

class InvoiceLineItem(BaseModel):
    description: str
    quantity: int = 1
    unit_price: float
    discount_pct: float = 0.0  # 0-100

class InvoiceCreate(BaseModel):
    customer_name: str
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    booking_id: Optional[str] = None
    items: List[InvoiceLineItem]
    apply_gst: bool = True
    gst_rate: float = GST_RATE
    payment_method: str = "cash"      # cash | card | upi | wallet | pending
    coupon_discount: float = 0.0
    loyalty_discount: float = 0.0
    notes: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_owner_salon(current_user: dict):
    salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")})
    if not salon:
        raise HTTPException(status_code=404, detail="No salon found for this account")
    return salon

def _strip(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc

def _compute_invoice(items: List[InvoiceLineItem], apply_gst: bool, gst_rate: float,
                     coupon_disc: float, loyalty_disc: float):
    line_items = []
    subtotal = 0.0
    for item in items:
        line_total = item.unit_price * item.quantity
        item_discount = line_total * (item.discount_pct / 100)
        net = line_total - item_discount
        line_items.append({
            "description": item.description,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "discount_pct": item.discount_pct,
            "discount_amount": round(item_discount, 2),
            "net_amount": round(net, 2)
        })
        subtotal += net

    total_before_extra_discounts = subtotal
    subtotal = max(0, subtotal - coupon_disc - loyalty_disc)
    gst_amount  = round(subtotal * gst_rate, 2) if apply_gst else 0.0
    grand_total = round(subtotal + gst_amount, 2)

    return line_items, {
        "subtotal": round(total_before_extra_discounts, 2),
        "coupon_discount": coupon_disc,
        "loyalty_discount": loyalty_disc,
        "taxable_amount": round(subtotal, 2),
        "gst_rate_pct": round(gst_rate * 100, 1) if apply_gst else 0,
        "gst_amount": gst_amount,
        "grand_total": grand_total
    }


# ── Create Invoice ────────────────────────────────────────────────────────────

@router.post("/create")
async def create_invoice(inv: InvoiceCreate, current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)
    line_items, totals = _compute_invoice(
        inv.items, inv.apply_gst, inv.gst_rate,
        inv.coupon_discount, inv.loyalty_discount
    )
    invoice_number = f"INV-{salon.get('name', 'SLN')[:3].upper()}-{str(uuid.uuid4().hex[:6]).upper()}"
    new_invoice = {
        "id": str(uuid.uuid4()),
        "invoice_number": invoice_number,
        "salon_id": salon["id"],
        "salon_name": salon.get("name"),
        "salon_address": salon.get("address"),
        "salon_phone": salon.get("phone"),
        "salon_gstin": salon.get("gstin"),
        "customer_name": inv.customer_name,
        "customer_phone": inv.customer_phone,
        "customer_email": inv.customer_email,
        "booking_id": inv.booking_id,
        "line_items": line_items,
        "payment_method": inv.payment_method,
        "payment_status": "paid" if inv.payment_method != "pending" else "pending",
        "notes": inv.notes,
        "issued_by": current_user.get("sub"),
        "created_at": datetime.utcnow(),
        **totals
    }
    invoices_collection.insert_one(new_invoice)
    new_invoice.pop("_id", None)

    # Auto-link to booking if provided
    if inv.booking_id:
        slot_bookings_collection.update_one(
            {"id": inv.booking_id, "salon_id": salon["id"]},
            {"$set": {"invoice_id": new_invoice["id"], "invoice_number": invoice_number}}
        )

    return {"status": "success", "invoice_number": invoice_number, "data": new_invoice}


# ── List Invoices ─────────────────────────────────────────────────────────────

@router.get("/")
async def list_invoices(
    payment_status: str = Query(None),
    payment_method: str = Query(None),
    date_from: str = Query(None),    # YYYY-MM-DD
    date_to: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    current_user: dict = Depends(get_current_user)
):
    salon = _get_owner_salon(current_user)
    query: dict = {"salon_id": salon["id"]}
    if payment_status:
        query["payment_status"] = payment_status
    if payment_method:
        query["payment_method"] = payment_method

    skip = (page - 1) * limit
    invoices = list(invoices_collection.find(query).sort("created_at", -1).skip(skip).limit(limit))
    total    = invoices_collection.count_documents(query)
    return {"invoices": [_strip(i) for i in invoices], "total": total, "page": page}


@router.get("/{invoice_id}")
async def get_invoice(invoice_id: str, current_user: dict = Depends(get_current_user)):
    invoice = invoices_collection.find_one({"id": invoice_id})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    salon = _get_owner_salon(current_user)
    if invoice.get("salon_id") != salon["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    return _strip(invoice)


@router.patch("/{invoice_id}/payment-status")
async def update_payment_status(
    invoice_id: str,
    status: str,
    current_user: dict = Depends(get_current_user)
):
    if status not in ["paid", "pending", "cancelled", "refunded"]:
        raise HTTPException(status_code=400, detail="Invalid payment status")
    salon = _get_owner_salon(current_user)
    result = invoices_collection.update_one(
        {"id": invoice_id, "salon_id": salon["id"]},
        {"$set": {"payment_status": status, "updated_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"status": "success", "payment_status": status}


# ── Revenue Analytics ─────────────────────────────────────────────────────────

@router.get("/analytics/revenue")
async def revenue_analytics(
    period: str = Query("month", description="week | month | year"),
    current_user: dict = Depends(get_current_user)
):
    salon = _get_owner_salon(current_user)
    all_invoices = list(invoices_collection.find({"salon_id": salon["id"], "payment_status": "paid"}))

    total_revenue  = sum(i.get("grand_total", 0) for i in all_invoices)
    total_gst      = sum(i.get("gst_amount", 0) for i in all_invoices)
    total_invoices = len(all_invoices)

    by_method: dict = {}
    for inv in all_invoices:
        method = inv.get("payment_method", "other")
        by_method[method] = by_method.get(method, 0) + inv.get("grand_total", 0)

    return {
        "total_revenue": round(total_revenue, 2),
        "total_gst_collected": round(total_gst, 2),
        "net_revenue": round(total_revenue - total_gst, 2),
        "total_invoices": total_invoices,
        "avg_invoice_value": round(total_revenue / total_invoices, 2) if total_invoices else 0,
        "by_payment_method": {k: round(v, 2) for k, v in by_method.items()},
        "pending_amount": sum(
            i.get("grand_total", 0)
            for i in invoices_collection.find({"salon_id": salon["id"], "payment_status": "pending"})
        )
    }
