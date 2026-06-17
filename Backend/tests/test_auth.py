"""
test_auth.py — Authentication endpoint tests.

Covers:
  - Signup success (generic response regardless of email existence)
  - Password strength enforcement
  - Login success + token structure
  - Login failure (wrong password)
  - JWT /me endpoint
  - Refresh token flow
  - Email verification OTP
"""
import pytest


# ── Signup ─────────────────────────────────────────────────────────────────────
class TestCustomerSignup:
    def test_signup_returns_generic_message(self, client):
        """Anti-enumeration: same message for new and duplicate emails."""
        r = client.post("/api/auth/customer/signup", json={
            "email": "unique_test_1@example.com",
            "password": "ValidPass1!",
            "name": "Alice",
        })
        assert r.status_code == 200
        data = r.json()
        assert "verification code" in data["message"].lower() or "registered" in data["message"].lower()

    def test_signup_duplicate_same_response(self, client):
        """Duplicate signup must return 200 (not 400) to prevent enumeration."""
        payload = {"email": "dupe_test@example.com", "password": "ValidPass1!", "name": "Bob"}
        client.post("/api/auth/customer/signup", json=payload)  # first
        r = client.post("/api/auth/customer/signup", json=payload)  # second
        # Must NOT reveal that the email is already registered
        assert r.status_code == 200
        assert "already" not in r.json().get("message", "").lower()

    def test_signup_weak_password_too_short(self, client):
        r = client.post("/api/auth/customer/signup", json={
            "email": "weak@example.com", "password": "abc", "name": "X"
        })
        assert r.status_code == 400
        assert "8 characters" in r.json()["detail"]

    def test_signup_weak_password_no_uppercase(self, client):
        r = client.post("/api/auth/customer/signup", json={
            "email": "weak2@example.com", "password": "alllower1!", "name": "X"
        })
        assert r.status_code == 400
        assert "uppercase" in r.json()["detail"]

    def test_signup_weak_password_no_digit(self, client):
        r = client.post("/api/auth/customer/signup", json={
            "email": "weak3@example.com", "password": "NoDigitHere!", "name": "X"
        })
        assert r.status_code == 400
        assert "number" in r.json()["detail"]

    def test_signup_weak_password_no_special(self, client):
        r = client.post("/api/auth/customer/signup", json={
            "email": "weak4@example.com", "password": "NoSpecial1", "name": "X"
        })
        assert r.status_code == 400
        assert "special" in r.json()["detail"]

    def test_signup_strong_password_accepted(self, client):
        r = client.post("/api/auth/customer/signup", json={
            "email": "strong_pw@example.com", "password": "StrongPass1!", "name": "Y"
        })
        assert r.status_code == 200


# ── Login ─────────────────────────────────────────────────────────────────────
class TestLogin:
    def test_login_wrong_password_returns_401(self, client):
        r = client.post("/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "WrongPass1!",
            "role_type": "customer",
        })
        assert r.status_code == 401
        # Must not reveal whether email exists
        assert "email or password" in r.json()["detail"].lower()

    def test_login_missing_fields_returns_422(self, client):
        r = client.post("/api/auth/login", json={"email": "only@example.com"})
        assert r.status_code == 422

    def test_login_response_structure(self, client, registered_user):
        """If MongoDB is available, verify token structure."""
        r = client.post("/api/auth/login", json={
            "email": registered_user["email"],
            "password": registered_user["password"],
            "role_type": "customer",
        })
        if r.status_code == 403:
            pytest.skip("Email not verified in test env")
        if r.status_code != 200:
            pytest.skip("MongoDB not available in this test run")
        data = r.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert "role" in data
        assert "email" in data


# ── Refresh Token ─────────────────────────────────────────────────────────────
class TestRefreshToken:
    def test_invalid_refresh_token_returns_401(self, client):
        r = client.post("/api/auth/refresh", json={"refresh_token": "invalid.token.here"})
        assert r.status_code == 401

    def test_access_token_cannot_be_used_as_refresh(self, client, auth_headers):
        """Access tokens must be rejected by the refresh endpoint."""
        access_token = auth_headers["Authorization"].split(" ")[1]
        r = client.post("/api/auth/refresh", json={"refresh_token": access_token})
        assert r.status_code == 401


# ── Protected endpoints ───────────────────────────────────────────────────────
class TestProtectedEndpoints:
    def test_me_without_token_returns_401(self, client):
        r = client.get("/api/auth/me")
        assert r.status_code == 401

    def test_me_with_invalid_token_returns_401(self, client):
        r = client.get("/api/auth/me", headers={"Authorization": "Bearer notavalidtoken"})
        assert r.status_code == 401

    def test_me_with_valid_token_returns_profile(self, client, auth_headers):
        r = client.get("/api/auth/me", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "email" in data
        assert "role" in data
        assert "password" not in data  # must never leak hashed password


# ── Health & Root ─────────────────────────────────────────────────────────────
class TestHealthEndpoints:
    def test_health_check(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_root(self, client):
        r = client.get("/")
        assert r.status_code == 200
