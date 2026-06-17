"""
conftest.py — Shared pytest fixtures.

Run tests with:
    cd Backend
    pip install pytest httpx pytest-asyncio --break-system-packages
    pytest tests/ -v
"""
import os
import pytest

# ── Ensure test env uses a predictable JWT secret ─────────────────────────────
os.environ.setdefault("JWT_SECRET", "test_secret_32_chars_long_min___x")
os.environ.setdefault("MONGODB_URL", "mongodb://localhost:27017")
os.environ.setdefault("MONGODB_DB_NAME", "beauty_test")

from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def client():
    """FastAPI TestClient — creates the app once per test session."""
    from app.main import app
    with TestClient(app) as c:
        yield c


@pytest.fixture
def registered_user(client):
    """Sign up + verify a fresh test user and return credentials."""
    import random
    email = f"test_{random.randint(10000,99999)}@example.com"
    password = "TestPass1!"
    # Signup
    r = client.post("/api/auth/customer/signup", json={
        "email": email, "password": password, "name": "Test User"
    })
    assert r.status_code == 200, r.text
    return {"email": email, "password": password}


@pytest.fixture
def auth_headers(client, registered_user):
    """Log in a registered user and return Authorization header dict.
    
    Note: In a fresh test environment without a real MongoDB, login will fail.
    These tests are designed to be run against a live test MongoDB instance.
    """
    r = client.post("/api/auth/login", json={
        "email": registered_user["email"],
        "password": registered_user["password"],
        "role_type": "customer",
    })
    if r.status_code != 200:
        pytest.skip("Login failed — is the test MongoDB running?")
    token = r.json().get("access_token")
    return {"Authorization": f"Bearer {token}"}
