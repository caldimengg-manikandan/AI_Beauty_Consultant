import requests

BASE_URL = "http://127.0.0.1:8000"

# Test with CORS headers
headers = {
    "Content-Type": "application/json",
    "Origin": "http://localhost:3000"
}

# Test Signup
print("Testing Signup with CORS...")
try:
    res = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={"email": "cors_test@example.com", "password": "password123"},
        headers=headers
    )
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")
    print(f"CORS Headers: {res.headers.get('access-control-allow-origin')}")
except Exception as e:
    print(f"Error: {e}")

# Test Login
print("\nTesting Login with CORS...")
try:
    res = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "cors_test@example.com", "password": "password123"},
        headers=headers
    )
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")
    print(f"CORS Headers: {res.headers.get('access-control-allow-origin')}")
except Exception as e:
    print(f"Error: {e}")
