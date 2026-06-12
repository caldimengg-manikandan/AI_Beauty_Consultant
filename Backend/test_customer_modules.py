import requests

BASE_URL = "http://localhost:8000/api"

def test_customer_modules():
    print("--- Testing Customer Modules Workflow ---")
    
    # 1. Login
    login_url = f"{BASE_URL}/auth/login"
    login_data = {
        "email": "jasminedorathyvasantharaj@gmail.com",
        "password": "123456",
        "role_type": "customer"
    }
    print(f"Logging in to {login_url}...")
    resp = requests.post(login_url, json=login_data)
    if resp.status_code != 200:
        print(f"Failed to login. Status: {resp.status_code}")
        print(resp.text)
        return
        
    token = resp.json().get("access_token")
    if not token:
        print("Login successful but no access token received.")
        return
        
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful. Acquired token.\n")
    
    # Endpoints to test
    endpoints = [
        ("Profile", "GET", "/onboarding/profile"),
        ("Premium Stats", "GET", "/premium/stats"),
        ("Salons List", "GET", "/salons/"),
        ("Reels Feed", "GET", "/reels/feed"),
        ("My Orders", "GET", "/orders/my-orders"),
        ("My Tickets", "GET", "/support/my-tickets"),
        ("My Beauty Passport", "GET", "/passport/me"),
        ("Routines", "GET", "/routine/"),
        ("Settings", "GET", "/settings/")
    ]
    
    success_count = 0
    for name, method, path in endpoints:
        url = f"{BASE_URL}{path}"
        print(f"Testing {name} ({method} {path})...")
        
        try:
            if method == "GET":
                r = requests.get(url, headers=headers)
            else:
                r = requests.post(url, headers=headers)
                
            print(f"  Status: {r.status_code}")
            if r.status_code == 200:
                success_count += 1
            else:
                print(f"  Response: {r.text[:200]}")
        except Exception as e:
            print(f"  Exception: {e}")
            
    print("\n--- Summary ---")
    print(f"Passed: {success_count} / {len(endpoints)}")

if __name__ == '__main__':
    test_customer_modules()
