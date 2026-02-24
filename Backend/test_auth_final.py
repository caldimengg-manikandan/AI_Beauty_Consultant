import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_auth():
    email = "test_bot@example.com"
    password = "password123"
    
    # 1. Signup
    print(f"Testing Signup for {email}...")
    try:
        res = requests.post(f"{BASE_URL}/api/auth/signup", json={"email": email, "password": password})
        print(f"Signup Status: {res.status_code}")
        print(f"Signup Response: {res.text}")
    except Exception as e:
        print(f"Signup Error: {e}")

    # 2. Login
    print(f"\nTesting Login for {email}...")
    try:
        res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
        print(f"Login Status: {res.status_code}")
        print(f"Login Response: {res.text}")
    except Exception as e:
        print(f"Login Error: {e}")

if __name__ == "__main__":
    test_auth()
