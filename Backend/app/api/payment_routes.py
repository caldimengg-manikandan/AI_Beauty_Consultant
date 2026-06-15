import logging
_log = logging.getLogger("beauty_api.payments")

"""
Razorpay Payment Routes — Full Integration
Handles: order creation, payment verification, refunds, payment history.
Works in demo mode when RAZORPAY_KEY_ID is not set.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import os
import hmac
import hashlib
import uuid
from datetime import datetime

from app.auth.jwt_handler import get_current_user
from app.mongodb.collections import slot_bookings_collection, db

router = APIRouter(prefix="/api/payments", tags=["Payments"])

RAZORPAY_KEY_ID     = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

payments_collection = db["payments"]


# ── Schemas ───────────────────────────────────────────────────────────────────

class CreateOrderRequest(BaseModel):
    booking_id: str
    amount: float           # in INR
    currency: str = "INR"
    description: Optional[str] = None


class VerifyPaymentRequest(BaseModel):
    booking_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class RefundRequest(BaseModel):
    booking_id: str
    reason: Optional[str] = "Customer requested"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/config")
async def get_payment_config():
    """Return Razorpay publishable key for the frontend."""
    return {
        "key_id": RAZORPAY_KEY_ID or "rzp_test_demo",
        "currency": "INR",
        "is_live": bool(RAZORPAY_KEY_ID and not RAZORPAY_KEY_ID.startswith("rzp_test")),
        "is_configured": bool(RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET),
    }


@router.post("/create-order")
async def create_payment_order(
    req: CreateOrderRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a Razorpay order. Falls back to demo mode if keys not set."""
    # Validate booking exists
    booking = slot_bookings_collection.find_one({"$or": [{"id": req.booking_id}, {"booking_ref": req.booking_id}]})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    amount_paise = int(req.amount * 100)  # Razorpay works in paise

    # ── Demo Mode (no API keys) ───────────────────────────────────────────────
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        demo_order_id = f"order_demo_{uuid.uuid4().hex[:12]}"
        # Record pending payment
        payments_collection.insert_one({
            "id": str(uuid.uuid4()),
            "booking_id": req.booking_id,
            "user_id": current_user.get("sub"),
            "razorpay_order_id": demo_order_id,
            "amount": req.amount,
            "currency": req.currency,
            "status": "created",
            "mode": "demo",
            "created_at": datetime.utcnow().isoformat()
        })
        return {
            "order_id": demo_order_id,
            "amount": amount_paise,
            "currency": req.currency,
            "key": "rzp_test_demo",
            "booking_id": req.booking_id,
            "is_demo": True,
            "description": req.description or f"Salon booking #{req.booking_id[:8].upper()}",
            "prefill": {
                "name": booking.get("customer_name", ""),
                "email": current_user.get("sub", ""),
            },
            "message": "Demo mode: Add RAZORPAY_KEY_ID to .env for real payments"
        }

    # ── Real Razorpay ─────────────────────────────────────────────────────────
    try:
        import razorpay
        client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
        order = client.order.create({
            "amount": amount_paise,
            "currency": req.currency,
            "receipt": req.booking_id[:40],
            "notes": {
                "booking_id": req.booking_id,
                "user": current_user.get("sub"),
                "description": req.description or "Salon booking"
            }
        })
        # Record in DB
        payments_collection.insert_one({
            "id": str(uuid.uuid4()),
            "booking_id": req.booking_id,
            "user_id": current_user.get("sub"),
            "razorpay_order_id": order["id"],
            "amount": req.amount,
            "currency": req.currency,
            "status": "created",
            "mode": "live",
            "created_at": datetime.utcnow().isoformat()
        })
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key": RAZORPAY_KEY_ID,
            "booking_id": req.booking_id,
            "is_demo": False,
            "description": req.description or "Salon Booking",
            "prefill": {
                "name": booking.get("customer_name", ""),
                "email": current_user.get("sub", ""),
            }
        }
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="Razorpay not installed. Run: pip install razorpay"
        )
    except Exception as e:
        _log.exception("Payment order creation error")
        raise HTTPException(status_code=500, detail="Payment service encountered an error. Please try again.")


@router.post("/verify")
async def verify_payment(
    req: VerifyPaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Verify Razorpay payment signature and mark booking as paid."""

    # ── Demo Mode ─────────────────────────────────────────────────────────────
    if req.razorpay_order_id.startswith("order_demo_"):
        slot_bookings_collection.update_one(
            {"$or": [{"id": req.booking_id}, {"booking_ref": req.booking_id}]},
            {"$set": {
                "status": "confirmed",
                "payment_status": "paid",
                "payment_id": req.razorpay_payment_id or "demo_pay_" + uuid.uuid4().hex[:8],
                "razorpay_order_id": req.razorpay_order_id,
                "paid_at": datetime.utcnow().isoformat(),
            }}
        )
        payments_collection.update_one(
            {"booking_id": req.booking_id, "razorpay_order_id": req.razorpay_order_id},
            {"$set": {"status": "paid", "paid_at": datetime.utcnow().isoformat()}}
        )
        return {
            "status": "success",
            "message": "Booking confirmed! (Demo payment recorded)",
            "booking_id": req.booking_id,
            "mode": "demo"
        }

    # ── Real Signature Verification ───────────────────────────────────────────
    if not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="Payment service not configured")

    expected_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        f"{req.razorpay_order_id}|{req.razorpay_payment_id}".encode(),
        hashlib.sha256
    ).hexdigest()

    if expected_signature != req.razorpay_signature:
        raise HTTPException(status_code=400, detail="Payment verification failed — invalid signature")

    # Mark booking as paid and confirmed
    slot_bookings_collection.update_one(
        {"$or": [{"id": req.booking_id}, {"booking_ref": req.booking_id}]},
        {"$set": {
            "status": "confirmed",
            "payment_status": "paid",
            "payment_id": req.razorpay_payment_id,
            "razorpay_order_id": req.razorpay_order_id,
            "razorpay_signature": req.razorpay_signature,
            "paid_at": datetime.utcnow().isoformat(),
        }}
    )
    payments_collection.update_one(
        {"booking_id": req.booking_id},
        {"$set": {
            "status": "paid",
            "razorpay_payment_id": req.razorpay_payment_id,
            "paid_at": datetime.utcnow().isoformat()
        }}
    )

    return {
        "status": "success",
        "message": "Payment verified and booking confirmed!",
        "booking_id": req.booking_id,
        "payment_id": req.razorpay_payment_id,
    }


@router.post("/refund")
async def request_refund(
    req: RefundRequest,
    current_user: dict = Depends(get_current_user)
):
    """Initiate a refund for a paid booking."""
    booking = slot_bookings_collection.find_one({
        "$or": [{"id": req.booking_id}, {"booking_ref": req.booking_id}],
        "user_id": current_user.get("sub"),
        "payment_status": "paid"
    })
    if not booking:
        raise HTTPException(status_code=404, detail="Paid booking not found")

    payment_id = booking.get("payment_id", "")
    if payment_id.startswith("demo_") or payment_id == "mock_payment":
        # Demo refund
        slot_bookings_collection.update_one(
            {"$or": [{"id": req.booking_id}, {"booking_ref": req.booking_id}]},
            {"$set": {"payment_status": "refunded", "status": "cancelled"}}
        )
        return {"status": "success", "message": "Refund processed (Demo mode)", "booking_id": req.booking_id}

    if not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="Payment service not configured for refunds")

    try:
        import razorpay
        client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
        refund = client.payment.refund(payment_id, {
            "notes": {"reason": req.reason, "booking_id": req.booking_id}
        })
        slot_bookings_collection.update_one(
            {"$or": [{"id": req.booking_id}, {"booking_ref": req.booking_id}]},
            {"$set": {
                "payment_status": "refunded",
                "status": "cancelled",
                "refund_id": refund.get("id"),
                "refunded_at": datetime.utcnow().isoformat()
            }}
        )
        return {
            "status": "success",
            "message": "Refund initiated successfully",
            "refund_id": refund.get("id"),
            "booking_id": req.booking_id
        }
    except Exception as e:
        _log.exception("Refund processing error")
        raise HTTPException(status_code=500, detail="Refund service encountered an error. Please try again.")


@router.get("/my-history")
async def my_payment_history(current_user: dict = Depends(get_current_user)):
    """Get user's payment history."""
    bookings = list(slot_bookings_collection.find(
        {"user_id": current_user.get("sub"), "payment_status": {"$in": ["paid", "refunded"]}}
    ).sort("paid_at", -1).limit(20))
    for b in bookings:
        b.pop("_id", None)
    return {"payments": bookings, "total": len(bookings)}
