import logging
_log = logging.getLogger("beauty_api.ecommerce")

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from app.auth.jwt_handler import get_current_user
from app.mongodb.collections import inventory_collection, ecommerce_carts_collection, ecommerce_orders_collection, salons_collection

router = APIRouter(prefix="/api/ecommerce", tags=["E-Commerce"])

# ── Models ────────────────────────────────────────────────────────────────────
class CartItem(BaseModel):
    product_id: str
    quantity: int

class CheckoutRequest(BaseModel):
    shipping_address: str
    payment_method: str = "card"

# ── Helper ────────────────────────────────────────────────────────────────────
def serialize_doc(doc):
    if not doc:
        return None
    doc['id'] = str(doc['_id'])
    del doc['_id']
    # Stringify any other ObjectIds
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            doc[k] = str(v)
    return doc

# ── Products (Retail Inventory) ───────────────────────────────────────────────
@router.get("/products")
async def get_products():
    """Get all retail products available across salons."""
    products_cursor = inventory_collection.find({
        "category": "Retail",
        "quantity_in_stock": {"$gt": 0}
    })
    products = []
    for p in products_cursor:
        p_dict = serialize_doc(p)
        # Fetch salon info for vendor details
        salon_id = p_dict.get("salon_id")
        if salon_id:
            try:
                salon = salons_collection.find_one({"_id": ObjectId(salon_id)})
                p_dict["vendor_name"] = salon.get("name", "Unknown Salon") if salon else "HQ"
            except Exception:
                p_dict["vendor_name"] = "HQ"
        else:
            p_dict["vendor_name"] = "HQ"
        products.append(p_dict)
    return products

# ── Cart Management ───────────────────────────────────────────────────────────
@router.get("/cart")
async def get_cart(user: dict = Depends(get_current_user)):
    user_id = user.get("sub")
    cart = ecommerce_carts_collection.find_one({"user_id": user_id})
    if not cart:
        return {"items": [], "total": 0}
    
    # Enrich cart items
    enriched_items = []
    total = 0
    for item in cart.get("items", []):
        prod = inventory_collection.find_one({"_id": ObjectId(item["product_id"])})
        if prod:
            enriched = serialize_doc(prod)
            enriched["cart_quantity"] = item["quantity"]
            enriched_items.append(enriched)
            total += enriched.get("unit_price", 0) * item["quantity"]
    
    return {"items": enriched_items, "total": total}

@router.post("/cart")
async def add_to_cart(item: CartItem, user: dict = Depends(get_current_user)):
    user_id = user.get("sub")
    try:
        prod = inventory_collection.find_one({"_id": ObjectId(item.product_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product ID format")

    if not prod or prod.get("category") != "Retail":
        raise HTTPException(status_code=404, detail="Product not found or not retail")
    
    if prod.get("quantity_in_stock", 0) < item.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock")

    cart = ecommerce_carts_collection.find_one({"user_id": user_id})
    if not cart:
        cart = {"user_id": user_id, "items": [{"product_id": item.product_id, "quantity": item.quantity}]}
        ecommerce_carts_collection.insert_one(cart)
    else:
        items = cart.get("items", [])
        found = False
        for i in items:
            if i["product_id"] == item.product_id:
                i["quantity"] += item.quantity
                found = True
                break
        if not found:
            items.append({"product_id": item.product_id, "quantity": item.quantity})
        ecommerce_carts_collection.update_one({"user_id": user_id}, {"$set": {"items": items}})
    
    return {"message": "Added to cart"}

@router.delete("/cart/{product_id}")
async def remove_from_cart(product_id: str, user: dict = Depends(get_current_user)):
    user_id = user.get("sub")
    cart = ecommerce_carts_collection.find_one({"user_id": user_id})
    if cart:
        items = [i for i in cart.get("items", []) if i["product_id"] != product_id]
        ecommerce_carts_collection.update_one({"user_id": user_id}, {"$set": {"items": items}})
    return {"message": "Removed from cart"}

# ── Checkout & Orders ─────────────────────────────────────────────────────────
@router.post("/checkout")
async def process_checkout(req: CheckoutRequest, user: dict = Depends(get_current_user)):
    user_id = user.get("sub")
    cart = ecommerce_carts_collection.find_one({"user_id": user_id})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    total = 0
    order_items = []
    
    # Validate stock and calculate total
    for item in cart.get("items", []):
        try:
            prod = inventory_collection.find_one({"_id": ObjectId(item["product_id"])})
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid product ID: {item['product_id']}")

        if not prod or prod.get("quantity_in_stock", 0) < item["quantity"]:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for product ID {item['product_id']}")
        
        cost = prod.get("unit_price", 0) * item["quantity"]
        total += cost
        order_items.append({
            "product_id": item["product_id"],
            "item_name": prod.get("item_name"),
            "vendor_id": prod.get("salon_id"),
            "quantity": item["quantity"],
            "unit_price": prod.get("unit_price", 0),
            "subtotal": cost
        })
    
    # Deduct stock
    for item in cart.get("items", []):
        inventory_collection.update_one(
            {"_id": ObjectId(item["product_id"])},
            {"$inc": {"quantity_in_stock": -item["quantity"]}}
        )
    
    # Create order
    order_doc = {
        "user_id": user_id,
        "items": order_items,
        "total_amount": total,
        "shipping_address": req.shipping_address,
        "payment_method": req.payment_method,
        "status": "processing",
        "created_at": datetime.utcnow().isoformat()
    }
    res = ecommerce_orders_collection.insert_one(order_doc)
    
    # Clear cart
    ecommerce_carts_collection.update_one({"user_id": user_id}, {"$set": {"items": []}})
    
    return {"message": "Checkout successful", "order_id": str(res.inserted_id)}

@router.get("/orders")
async def get_my_orders(user: dict = Depends(get_current_user)):
    user_id = user.get("sub")
    orders = ecommerce_orders_collection.find({"user_id": user_id}).sort("created_at", -1)
    return [serialize_doc(o) for o in orders]
