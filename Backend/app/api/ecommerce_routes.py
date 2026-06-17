import logging
_log = logging.getLogger("beauty_api.ecommerce")

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import math

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
async def get_products(
    page: int = 1,
    limit: int = 12,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: str = "latest"
):
    """Get all retail products available across salons."""
    base_query = {
        "$or": [
            {"category": "Retail", "quantity_in_stock": {"$gt": 0}},
            {"is_active": True, "quantity": {"$gt": 0}}
        ]
    }
    
    if search:
        base_query["$and"] = [
            {"$or": [
                {"item_name": {"$regex": search, "$options": "i"}},
                {"name": {"$regex": search, "$options": "i"}}
            ]}
        ]
        
    if min_price is not None or max_price is not None:
        price_query = {}
        if min_price is not None:
            price_query["$gte"] = min_price
        if max_price is not None:
            price_query["$lte"] = max_price
        base_query["unit_price"] = price_query

    # Sorting
    sort_query = [("_id", -1)] # default latest
    if sort_by == "price_asc":
        sort_query = [("unit_price", 1)]
    elif sort_by == "price_desc":
        sort_query = [("unit_price", -1)]

    total_count = inventory_collection.count_documents(base_query)
    
    products_cursor = inventory_collection.find(base_query).sort(sort_query).skip((page - 1) * limit).limit(limit)
    
    products = []
    for p in products_cursor:
        p_dict = serialize_doc(p)
        
        # Normalize fields for EcommerceStore
        if "item_name" not in p_dict and "name" in p_dict:
            p_dict["item_name"] = p_dict["name"]
        if "quantity_in_stock" not in p_dict and "quantity" in p_dict:
            p_dict["quantity_in_stock"] = p_dict["quantity"]
            
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
        
    return {
        "products": products,
        "total": total_count,
        "page": page,
        "pages": math.ceil(total_count / limit) if limit else 1
    }

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
            if "item_name" not in enriched and "name" in enriched:
                enriched["item_name"] = enriched["name"]
            if "quantity_in_stock" not in enriched and "quantity" in enriched:
                enriched["quantity_in_stock"] = enriched["quantity"]
                
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

    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
        
    is_retail = prod.get("category") == "Retail"
    is_active_shop = prod.get("is_active", False)
    
    if not (is_retail or is_active_shop):
        raise HTTPException(status_code=404, detail="Product not available for online purchase")
    
    stock = prod.get("quantity_in_stock", prod.get("quantity", 0))
    if stock < item.quantity:
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

        if not prod:
            raise HTTPException(status_code=400, detail=f"Product not found: {item['product_id']}")
            
        stock = prod.get("quantity_in_stock", prod.get("quantity", 0))
        if stock < item["quantity"]:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for product ID {item['product_id']}")
        
        cost = prod.get("unit_price", 0) * item["quantity"]
        total += cost
        item_name = prod.get("item_name", prod.get("name", "Unknown Product"))
        order_items.append({
            "product_id": item["product_id"],
            "item_name": item_name,
            "vendor_id": prod.get("salon_id"),
            "quantity": item["quantity"],
            "unit_price": prod.get("unit_price", 0),
            "subtotal": cost
        })
    
    # Deduct stock
    for item in cart.get("items", []):
        prod = inventory_collection.find_one({"_id": ObjectId(item["product_id"])})
        if prod and "quantity" in prod:
            inventory_collection.update_one(
                {"_id": ObjectId(item["product_id"])},
                {"$inc": {"quantity": -item["quantity"]}}
            )
        elif prod and "quantity_in_stock" in prod:
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
