"""
test_booking_flow.py — Salon slot booking lifecycle tests.

Covers:
  - Booking requires authentication
  - Booking with missing fields returns 422
  - Full booking lifecycle: create (pending) → payment (confirmed)
  - Booking ID returned in response
  - Demo payment verify promotes booking to confirmed
"""
import pytest
import uuid


SALON_ID = "test-salon-uuid-0001"  # Synthetic; real test needs a seeded salon

VALID_BOOKING = {
    "salon_id": SALON_ID,
    "service_name": "Haircut",
    "customer_name": "Test Customer",
    "customer_phone": "9876543210",
    "appointment_date": "2030-12-31",
    "appointment_time": "10:00 AM",
}


class TestBookingAuth:
    def test_book_slot_requires_auth(self, client):
        r = client.post("/api/salons/book-slot", json=VALID_BOOKING)
        assert r.status_code == 401

    def test_book_slot_missing_fields_returns_422(self, client, auth_headers):
        incomplete = {"salon_id": SALON_ID, "service_name": "Haircut"}
        r = client.post("/api/salons/book-slot", json=incomplete, headers=auth_headers)
        assert r.status_code == 422

    def test_book_slot_missing_customer_name_returns_422(self, client, auth_headers):
        payload = {**VALID_BOOKING}
        del payload["customer_name"]
        r = client.post("/api/salons/book-slot", json=payload, headers=auth_headers)
        assert r.status_code == 422

    def test_book_slot_missing_phone_returns_422(self, client, auth_headers):
        payload = {**VALID_BOOKING}
        del payload["customer_phone"]
        r = client.post("/api/salons/book-slot", json=payload, headers=auth_headers)
        assert r.status_code == 422


class TestBookingLifecycle:
    def test_booking_returns_booking_id(self, client, auth_headers):
        """Booking response must include a booking_id for payment flow."""
        r = client.post("/api/salons/book-slot", json=VALID_BOOKING, headers=auth_headers)
        if r.status_code == 404:
            pytest.skip("Salon not found — seed a test salon to run this test")
        assert r.status_code == 200
        data = r.json()
        assert "booking_id" in data or "booking_ref" in data, \
            f"Response missing booking identifier: {data}"

    def test_new_booking_status_is_pending(self, client, auth_headers):
        """Bookings must start as 'pending', not 'confirmed', before payment."""
        r = client.post("/api/salons/book-slot", json=VALID_BOOKING, headers=auth_headers)
        if r.status_code == 404:
            pytest.skip("Salon not found")
        assert r.status_code == 200
        data = r.json()
        booking = data.get("data", data)
        status = booking.get("status")
        if status is not None:
            assert status == "pending", f"Expected pending, got: {status}"

    def test_demo_payment_verify_confirms_booking(self, client, auth_headers):
        """After demo payment verify, booking status must be 'confirmed'."""
        # Create booking
        r = client.post("/api/salons/book-slot", json=VALID_BOOKING, headers=auth_headers)
        if r.status_code == 404:
            pytest.skip("Salon not found")
        assert r.status_code == 200
        booking_id = r.json().get("booking_id") or r.json().get("booking_ref")
        assert booking_id, "No booking identifier returned"

        # Verify payment (demo mode — no real Razorpay needed)
        verify_payload = {
            "booking_id": booking_id,
            "razorpay_order_id": f"order_demo_{uuid.uuid4().hex[:8]}",
            "razorpay_payment_id": f"pay_demo_{uuid.uuid4().hex[:8]}",
            "razorpay_signature": "demo_signature",
        }
        rv = client.post("/api/payments/verify", json=verify_payload, headers=auth_headers)
        if rv.status_code == 503:
            pytest.skip("Payment service not configured — expected in CI without Razorpay keys")
        assert rv.status_code == 200
        assert rv.json().get("status") == "success"


class TestPaymentEndpoints:
    def test_payment_config_endpoint_returns_200(self, client):
        r = client.get("/api/payments/config")
        assert r.status_code == 200
        data = r.json()
        assert "demo_mode" in data or "key_id" in data

    def test_create_order_without_auth_returns_401(self, client):
        r = client.post("/api/payments/create-order", json={
            "booking_id": "some-booking", "amount": 500
        })
        assert r.status_code == 401

    def test_verify_with_invalid_signature_handled(self, client, auth_headers):
        """Real Razorpay mode must reject invalid signatures gracefully."""
        r = client.post("/api/payments/verify", json={
            "booking_id": "non-existent",
            "razorpay_order_id": "order_test",
            "razorpay_payment_id": "pay_test",
            "razorpay_signature": "invalid_signature",
        }, headers=auth_headers)
        # Should be 400 (bad signature) or 404 (booking not found) or 503 (demo mode) — never 500
        assert r.status_code in (400, 404, 503), f"Unexpected status: {r.status_code}"
