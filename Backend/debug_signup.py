
import requests
import json
import os
import random

BASE_URL = "http://127.0.0.1:8000"
LOG_FILE = "debug_result.txt"

def log(msg):
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(msg + "\n")
    print(msg)

def test():
    if os.path.exists(LOG_FILE):
        os.remove(LOG_FILE)
    
    log("Starting Debug Signup Test...")
    
    # 1. Test Signup with random email
    email = f"test_{random.randint(1000,9999)}@example.com"
    data = {
        "email": email,
        "password": "password123"
    }
    
    log(f"Attempting signup with {email}...")
    try:
        res = requests.post(f"{BASE_URL}/auth/signup", json=data)
        log(f"Signup Status: {res.status_code}")
        log(f"Signup Response: {res.text}")
    except Exception as e:
        log(f"Signup Exception: {e}")
        return

    # 2. Test Login
    log(f"Attempting login with {email}...")
    try:
        res = requests.post(f"{BASE_URL}/auth/login", json=data)
        log(f"Login Status: {res.status_code}")
        log(f"Login Response: {res.text}")
    except Exception as e:
         log(f"Login Exception: {e}")

if __name__ == "__main__":
    test()
