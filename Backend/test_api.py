"""
Diagnostic Script for AI Beauty Consultant
Tests login, analysis, and history endpoints
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_signup():
    """Test user signup"""
    print("\n" + "="*60)
    print("TEST 1: SIGNUP")
    print("="*60)
    
    data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/signup", json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Signup successful!")
            return True
        elif response.status_code == 400 and "already exists" in response.json().get("detail", ""):
            print("⚠️  User already exists (this is OK)")
            return True
        else:
            print("❌ Signup failed!")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_login():
    """Test user login"""
    print("\n" + "="*60)
    print("TEST 2: LOGIN")
    print("="*60)
    
    data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            token = response.json().get("access_token")
            if token:
                print(f"✅ Login successful!")
                print(f"Token (first 20 chars): {token[:20]}...")
                return token
            else:
                print("❌ No access_token in response!")
                return None
        else:
            print("❌ Login failed!")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None


def test_history(token):
    """Test history endpoint"""
    print("\n" + "="*60)
    print("TEST 3: HISTORY")
    print("="*60)
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/history", headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            history = response.json()
            print(f"✅ History retrieved! Found {len(history)} records")
            return True
        else:
            print("❌ History fetch failed!")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_analyze(token):
    """Test analyze endpoint with a dummy image"""
    print("\n" + "="*60)
    print("TEST 4: ANALYZE (requires test image)")
    print("="*60)
    
    # Check if test image exists
    import os
    test_image_path = "test_face.jpg"
    
    if not os.path.exists(test_image_path):
        print("⚠️  No test image found. Skipping analysis test.")
        print(f"   To test analysis, place a face image at: {test_image_path}")
        return None
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        with open(test_image_path, 'rb') as f:
            files = {'image': f}
            response = requests.post(f"{BASE_URL}/analyze", headers=headers, files=files)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Analysis successful!")
            print(f"Face Shape: {result.get('data', {}).get('face_shape', 'N/A')}")
            print(f"Gender: {result.get('data', {}).get('gender', 'N/A')}")
            return True
        else:
            print(f"❌ Analysis failed!")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_cors():
    """Test CORS configuration"""
    print("\n" + "="*60)
    print("TEST 5: CORS CONFIGURATION")
    print("="*60)
    
    headers = {
        "Origin": "http://localhost:3000"
    }
    
    try:
        response = requests.options(f"{BASE_URL}/auth/login", headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"CORS Headers:")
        for key, value in response.headers.items():
            if 'access-control' in key.lower():
                print(f"  {key}: {value}")
        
        if 'access-control-allow-origin' in response.headers:
            print("✅ CORS is configured!")
            return True
        else:
            print("⚠️  CORS headers not found")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == "__main__":
    print("="*60)
    print("AI BEAUTY CONSULTANT - DIAGNOSTIC TESTS")
    print("="*60)
    print(f"Testing backend at: {BASE_URL}")
    print("Make sure backend is running: python run.py")
    
    # Run tests
    test_signup()
    token = test_login()
    
    if token:
        test_history(token)
        test_analyze(token)
    else:
        print("\n❌ Cannot proceed without valid token")
    
    test_cors()
    
    print("\n" + "="*60)
    print("DIAGNOSTIC TESTS COMPLETE")
    print("="*60)
