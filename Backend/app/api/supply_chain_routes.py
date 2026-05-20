from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
from pydantic import BaseModel
import uuid

from app.auth.jwt_handler import get_current_user
from app.mongodb.collections import b2b_products_collection, b2b_orders_collection, salons_collection

router = APIRouter(prefix="/api/supply-chain", tags=["B2B Supply Chain"])

class OrderItem(BaseModel):
    product_id: str
    quantity: int

class B2BOrderCreate(BaseModel):
    items: List[OrderItem]
    use_invoice_financing: bool = False

def _get_owner_salon(current_user: dict):
    salon = salons_collection.find_one({"owner_user_id": current_user.get("sub") or str(current_user["_id"])})
    if not salon:
        raise HTTPException(status_code=404, detail="No salon found for this account")
    return salon

def seed_b2b_catalog_if_empty():
    count = b2b_products_collection.count_documents({})
    if count == 0:
        default_catalog = [
            {
                "id": str(uuid.uuid4()),
                "name": "L'Oréal Professional Hair Color (Bulk 50x)",
                "category": "Chemicals",
                "supplier": "BeautyBrands Wholesale Inc.",
                "price": 25000,
                "moq": 1, # Minimum Order Quantity
                "in_stock": 150,
                "auto_replenish_eligible": True,
                "image_url": "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=400&q=80"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Olaplex Salon Intro Kit",
                "category": "Treatments",
                "supplier": "Olaplex Direct",
                "price": 45000,
                "moq": 1,
                "in_stock": 25,
                "auto_replenish_eligible": False,
                "image_url": "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&w=400&q=80"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Premium Cotton Towels (Pack of 100)",
                "category": "Supplies",
                "supplier": "SalonEssentials",
                "price": 8500,
                "moq": 2,
                "in_stock": 500,
                "auto_replenish_eligible": True,
                "image_url": "https://images.unsplash.com/photo-1584989643440-b610c14b3003?auto=format&fit=crop&w=400&q=80"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Dyson Supersonic Pro Hair Dryers (Pack of 3)",
                "category": "Equipment",
                "supplier": "TechBeauty Ltd.",
                "price": 120000,
                "moq": 1,
                "in_stock": 10,
                "auto_replenish_eligible": False,
                "image_url": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80"
            }
        ]
        b2b_products_collection.insert_many(default_catalog)

@router.get("/catalog")
async def get_b2b_catalog():
    """Fetch the wholesale B2B marketplace catalog."""
    seed_b2b_catalog_if_empty()
    products = list(b2b_products_collection.find())
    for p in products:
        p.pop("_id", None)
    return products

@router.get("/orders")
async def get_b2b_orders(current_user: dict = Depends(get_current_user)):
    """Fetch past wholesale orders for the salon."""
    salon = _get_owner_salon(current_user)
    orders = list(b2b_orders_collection.find({"salon_id": str(salon["_id"])}).sort("created_at", -1))
    for o in orders:
        o.pop("_id", None)
    return orders

@router.post("/order")
async def place_b2b_order(req: B2BOrderCreate, current_user: dict = Depends(get_current_user)):
    """Place a new B2B order, optionally using invoice financing (Net-30 / BNPL)."""
    salon = _get_owner_salon(current_user)
    salon_id = str(salon["_id"])
    
    if not req.items:
        raise HTTPException(status_code=400, detail="Order is empty.")
        
    total_amount = 0
    order_items_detail = []
    
    for item in req.items:
        prod = b2b_products_collection.find_one({"id": item.product_id})
        if not prod:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found.")
        if prod.get("moq", 1) > item.quantity:
            raise HTTPException(status_code=400, detail=f"Minimum order quantity for {prod['name']} is {prod['moq']}.")
            
        line_total = prod["price"] * item.quantity
        total_amount += line_total
        
        order_items_detail.append({
            "product_id": prod["id"],
            "name": prod["name"],
            "supplier": prod["supplier"],
            "quantity": item.quantity,
            "unit_price": prod["price"],
            "line_total": line_total
        })
        
        # Deduct inventory
        b2b_products_collection.update_one(
            {"id": prod["id"]},
            {"$inc": {"in_stock": -item.quantity}}
        )

    # Handle Invoice Financing
    payment_status = "Paid"
    finance_fee = 0
    due_date = None
    
    if req.use_invoice_financing:
        if total_amount < 20000:
            raise HTTPException(status_code=400, detail="Invoice financing is only available for orders over ₹20,000.")
        payment_status = "Financed (Net-30)"
        finance_fee = int(total_amount * 0.02) # 2% financing fee
        due_date = (datetime.utcnow() + datetime.timedelta(days=30)).isoformat() if hasattr(datetime, "timedelta") else None # fallback later

    new_order = {
        "id": str(uuid.uuid4()),
        "salon_id": salon_id,
        "items": order_items_detail,
        "subtotal": total_amount,
        "finance_fee": finance_fee,
        "grand_total": total_amount + finance_fee,
        "status": "Processing",
        "payment_status": payment_status,
        "financed": req.use_invoice_financing,
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Quick fix for due_date without importing timedelta above
    if req.use_invoice_financing:
        import datetime as dt
        new_order["due_date"] = (dt.datetime.utcnow() + dt.timedelta(days=30)).isoformat()
        
    b2b_orders_collection.insert_one(new_order)
    new_order.pop("_id", None)
    
    return {"status": "success", "message": "B2B Order placed successfully.", "data": new_order}
