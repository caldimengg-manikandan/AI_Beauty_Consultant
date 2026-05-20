"""
Inventory Management Routes — Salon Partner B2B
Handles: product stock, low-stock alerts, usage tracking, vendor management
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.mongodb.collections import inventory_collection, salons_collection
from app.auth.jwt_handler import get_current_user
from app.auth.rbac import require_shop_owner
import uuid

router = APIRouter(
    prefix="/api/inventory",
    tags=["Inventory Management"],
    dependencies=[__import__('fastapi').Depends(require_shop_owner)]
)

LOW_STOCK_THRESHOLD = 5  # Default alert when quantity <= 5 units


# ── Schemas ───────────────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str
    category: str           # shampoo | conditioner | color | wax | tools | skincare | other
    brand: Optional[str] = None
    sku: Optional[str] = None
    quantity: int = 0
    unit: str = "units"     # units | ml | grams | liters
    unit_price: float = 0.0
    selling_price: float = 0.0
    low_stock_threshold: int = 5
    vendor_name: Optional[str] = None
    vendor_contact: Optional[str] = None
    notes: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    quantity: Optional[int] = None
    unit_price: Optional[float] = None
    selling_price: Optional[float] = None
    low_stock_threshold: Optional[int] = None
    vendor_name: Optional[str] = None
    vendor_contact: Optional[str] = None
    notes: Optional[str] = None

class StockAdjustment(BaseModel):
    product_id: str
    adjustment_type: str    # restock | used | damaged | sold | returned
    quantity: int
    unit_price: Optional[float] = None   # for restocks
    notes: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_owner_salon(current_user: dict):
    from app.mongodb.collections import salons_collection
    salon = salons_collection.find_one({"owner_user_id": current_user.get("sub")})
    if not salon:
        raise HTTPException(status_code=404, detail="No salon found for this account")
    return salon

def _strip(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


# ── Product CRUD ──────────────────────────────────────────────────────────────

@router.get("/")
async def list_inventory(
    category: str = Query(None),
    low_stock_only: bool = Query(False),
    search: str = Query(None),
    current_user: dict = Depends(get_current_user)
):
    salon = _get_owner_salon(current_user)
    query = {"salon_id": salon["id"], "is_active": True}
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}},
        ]
    products = list(inventory_collection.find(query).sort("name", 1))
    products = [_strip(p) for p in products]

    if low_stock_only:
        products = [p for p in products if p.get("quantity", 0) <= p.get("low_stock_threshold", LOW_STOCK_THRESHOLD)]

    # Annotate each product with stock status
    for p in products:
        qty = p.get("quantity", 0)
        threshold = p.get("low_stock_threshold", LOW_STOCK_THRESHOLD)
        p["stock_status"] = "out_of_stock" if qty == 0 else ("low" if qty <= threshold else "ok")

    return {
        "products": products,
        "total": len(products),
        "low_stock_count": sum(1 for p in products if p["stock_status"] in ["low", "out_of_stock"]),
        "out_of_stock_count": sum(1 for p in products if p["stock_status"] == "out_of_stock"),
    }


@router.post("/")
async def add_product(product: ProductCreate, current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)
    new_product = {
        "id": str(uuid.uuid4()),
        "salon_id": salon["id"],
        "is_active": True,
        "stock_history": [],
        "total_used": 0,
        "total_restocked": 0,
        "created_at": datetime.utcnow(),
        **product.dict()
    }
    # Auto-generate SKU if not provided
    if not new_product.get("sku"):
        new_product["sku"] = f"SKU-{str(uuid.uuid4().hex[:6]).upper()}"

    inventory_collection.insert_one(new_product)
    new_product.pop("_id", None)
    return {"status": "success", "message": "Product added to inventory", "data": new_product}


@router.put("/{product_id}")
async def update_product(product_id: str, updates: ProductUpdate, current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = inventory_collection.update_one(
        {"id": product_id, "salon_id": salon["id"]},
        {"$set": {**update_data, "updated_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"status": "success", "message": "Product updated"}


@router.delete("/{product_id}")
async def remove_product(product_id: str, current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)
    result = inventory_collection.update_one(
        {"id": product_id, "salon_id": salon["id"]},
        {"$set": {"is_active": False, "deleted_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"status": "success", "message": "Product removed from inventory"}


# ── Stock Adjustment ──────────────────────────────────────────────────────────

@router.post("/adjust")
async def adjust_stock(adj: StockAdjustment, current_user: dict = Depends(get_current_user)):
    """
    Adjust stock levels: restock, mark as used/damaged/sold.
    Positive quantity for restocks, exact value for deductions.
    """
    salon = _get_owner_salon(current_user)
    product = inventory_collection.find_one({"id": adj.product_id, "salon_id": salon["id"]})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    current_qty = product.get("quantity", 0)

    if adj.adjustment_type == "restock":
        new_qty = current_qty + adj.quantity
        inc_fields = {"quantity": adj.quantity, "total_restocked": adj.quantity}
    else:
        if adj.quantity > current_qty:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot deduct {adj.quantity} units. Only {current_qty} in stock."
            )
        new_qty = current_qty - adj.quantity
        inc_fields = {"quantity": -adj.quantity, "total_used": adj.quantity}

    history_entry = {
        "id": str(uuid.uuid4()),
        "type": adj.adjustment_type,
        "quantity_change": adj.quantity if adj.adjustment_type == "restock" else -adj.quantity,
        "quantity_before": current_qty,
        "quantity_after": new_qty,
        "unit_price": adj.unit_price,
        "notes": adj.notes,
        "performed_by": current_user.get("sub"),
        "timestamp": datetime.utcnow()
    }

    inventory_collection.update_one(
        {"id": adj.product_id},
        {
            "$inc": inc_fields,
            "$push": {"stock_history": history_entry},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )

    return {
        "status": "success",
        "product_id": adj.product_id,
        "product_name": product.get("name"),
        "adjustment": adj.adjustment_type,
        "quantity_before": current_qty,
        "quantity_after": new_qty,
        "low_stock_alert": new_qty <= product.get("low_stock_threshold", LOW_STOCK_THRESHOLD)
    }


# ── Alerts & Analytics ────────────────────────────────────────────────────────

@router.get("/alerts/low-stock")
async def get_low_stock_alerts(current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)
    products = list(inventory_collection.find({"salon_id": salon["id"], "is_active": True}))
    alerts = []
    for p in products:
        qty = p.get("quantity", 0)
        threshold = p.get("low_stock_threshold", LOW_STOCK_THRESHOLD)
        if qty <= threshold:
            p.pop("_id", None)
            alerts.append({
                "id": p["id"],
                "name": p["name"],
                "category": p.get("category"),
                "quantity": qty,
                "threshold": threshold,
                "status": "out_of_stock" if qty == 0 else "low",
                "vendor_name": p.get("vendor_name"),
                "vendor_contact": p.get("vendor_contact"),
            })
    return {
        "alerts": alerts,
        "alert_count": len(alerts),
        "out_of_stock": sum(1 for a in alerts if a["status"] == "out_of_stock"),
        "low_stock": sum(1 for a in alerts if a["status"] == "low"),
    }


@router.get("/analytics/summary")
async def inventory_analytics(current_user: dict = Depends(get_current_user)):
    salon = _get_owner_salon(current_user)
    products = list(inventory_collection.find({"salon_id": salon["id"], "is_active": True}))
    total_value = sum(p.get("quantity", 0) * p.get("unit_price", 0) for p in products)
    by_category = {}
    for p in products:
        cat = p.get("category", "other")
        if cat not in by_category:
            by_category[cat] = {"count": 0, "total_qty": 0, "value": 0.0}
        by_category[cat]["count"] += 1
        by_category[cat]["total_qty"] += p.get("quantity", 0)
        by_category[cat]["value"] += p.get("quantity", 0) * p.get("unit_price", 0)

    return {
        "total_products": len(products),
        "total_inventory_value": round(total_value, 2),
        "by_category": by_category,
        "low_stock_count": sum(
            1 for p in products
            if p.get("quantity", 0) <= p.get("low_stock_threshold", LOW_STOCK_THRESHOLD)
        ),
        "out_of_stock_count": sum(1 for p in products if p.get("quantity", 0) == 0),
    }
