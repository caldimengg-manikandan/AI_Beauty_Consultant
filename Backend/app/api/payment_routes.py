"""
Razorpay Payment Routes
Handles order creation and payment verification for slot bookings.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import os
import hmac
import hashlib
from datetime import datetime

from app.auth.jwt_handler import get_current_user
from app.mongodb.collections import slot_bookings_collection

router = APIRouter(prefix="/api/payments", tags=["Payments"])

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")


class CreateOrderRequest(BaseModel):
    booking_id: str
    amount: float        # in INR
    currency: str = "INR"


class VerifyPaymentRequest(BaseModel):
    booking_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/create-order")
async def create_payment_order(
    req: CreateOrderRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a Razorpay order for a slot booking."""
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        # Return mock order for development when keys not configured
        mock_order_id = f"order_mock_{req.booking_id[:8]}"
        return {
            "order_id": mock_order_id,
            "amount": int(req.amount * 100),  # in paise
            "currency": req.currency,
            "key": RAZORPAY_KEY_ID or "rzp_test_demo",
            "booking_id": req.booking_id,
            "is_mock": True,
            "message": "Demo mode: Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env for real payments"
        }

    try:
        import razorpay
        client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
        order = client.order.create({
            "amount": int(req.amount * 100),  # convert to paise
            "currency": req.currency,
            "receipt": req.booking_id,
            "notes": {"booking_id": req.booking_id, "user": current_user.get("sub")}
        })
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key": RAZORPAY_KEY_ID,
            "booking_id": req.booking_id,
        }
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="Razorpay not installed. Run: pip install razorpay"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Order creation failed: {str(e)}")


@router.post("/verify")
async def verify_payment(
    req: VerifyPaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Verify Razorpay payment signature and mark booking as paid."""

    # Handle mock orders in development
    if req.razorpay_order_id.startswith("order_mock_"):
        slot_bookings_collection.update_one(
            {"id": req.booking_id},
            {"$set": {
                "payment_status": "paid",
                "payment_id": req.razorpay_payment_id or "mock_payment",
                "razorpay_order_id": req.razorpay_order_id,
                "paid_at": datetime.utcnow(),
            }}
        )
        return {"status": "success", "message": "Payment recorded (Demo mode)", "booking_id": req.booking_id}

    if not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="Payment service not configured")

    # Verify signature
    expected_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        f"{req.razorpay_order_id}|{req.razorpay_payment_id}".encode(),
        hashlib.sha256
    ).hexdigest()

    if expected_signature != req.razorpay_signature:
        raise HTTPException(status_code=400, detail="Payment verification failed — invalid signature")

    # Update booking payment status
    slot_bookings_collection.update_one(
        {"id": req.booking_id},
        {"$set": {
            "payment_status": "paid",
            "payment_id": req.razorpay_payment_id,
            "razorpay_order_id": req.razorpay_order_id,
            "razorpay_signature": req.razorpay_signature,
            "paid_at": datetime.utcnow(),
        }}
    )

    return {
        "status": "success",
        "message": "Payment verified and booking confirmed!",
        "booking_id": req.booking_id,
        "payment_id": req.razorpay_payment_id,
    }


@router.get("/my-history")
async def my_payment_history(current_user: dict = Depends(get_current_user)):
    """Get user's payment history."""
    bookings = list(slot_bookings_collection.find(
        {"user_id": current_user.get("sub"), "payment_status": {"$in": ["paid", "refunded"]}}
    ).sort("paid_at", -1).limit(20))
    for b in bookings:
        b.pop("_id", None)
    return {"payments": bookings}
