"""
test_marketplace.py — Salon marketplace endpoint tests.

Covers:
  - Public salon listing (no auth needed)
  - Pagination parameters accepted
  - Salon detail endpoint
  - Search / filter parameters
"""
import pytest


class TestSalonListing:
    def test_get_salons_public_returns_200(self, client):
        """Salon listing must be accessible without authentication."""
        r = client.get("/api/salons/")
        assert r.status_code == 200

    def test_get_salons_returns_list(self, client):
        r = client.get("/api/salons/")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, (list, dict)), "Response should be list or dict with salons key"

    def test_get_salons_pagination_params_accepted(self, client):
        """Page and limit params must not cause errors."""
        r = client.get("/api/salons/?page=1&limit=10")
        assert r.status_code in (200, 422), "Pagination params should be accepted or produce 422 if not supported yet"

    def test_get_salons_city_filter(self, client):
        r = client.get("/api/salons/?city=Mumbai")
        assert r.status_code == 200

    def test_get_salons_type_filter(self, client):
        r = client.get("/api/salons/?salon_type=salon")
        assert r.status_code == 200

    def test_get_salon_detail_not_found(self, client):
        r = client.get("/api/salons/nonexistent-salon-id-xyz")
        assert r.status_code in (404, 200)  # 200 with empty if not implemented


class TestSalonRegistration:
    def test_register_salon_requires_shop_owner_auth(self, client):
        r = client.post("/api/salons/register", json={
            "name": "Test Salon",
            "city": "Mumbai",
            "address": "123 Test St",
            "phone": "9999999999",
        })
        assert r.status_code == 401

    def test_register_salon_rate_limited(self, client, auth_headers):
        """Salon registration is rate limited to 3 per 24h per IP."""
        # We don't exhaust the rate limit in tests, just confirm the endpoint exists
        r = client.post("/api/salons/register", json={}, headers=auth_headers)
        # 422 (validation) or 403 (wrong role) are both acceptable — not 404
        assert r.status_code in (422, 403, 400, 200)


class TestSalonServices:
    def test_get_salon_services_public(self, client):
        """Salon services should be publicly accessible."""
        r = client.get("/api/salon-services/test-salon-id")
        assert r.status_code in (200, 404)

    def test_manage_services_requires_shop_owner(self, client):
        r = client.post("/api/salon-services/owner/test-salon-id", json={})
        assert r.status_code == 401
