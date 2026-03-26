import requests
import json
import os
import time

def load_api_key():
    try:
        with open(".env", "r") as f:
            for line in f:
                if line.startswith("OPENROUTER_API_KEY"):
                    return line.strip().split("=")[1]
    except:
        return None

def test_simple():
    api_key = load_api_key()
    if not api_key:
        print("No API Key found")
        return

    print(f"Using Key: {api_key[:10]}...")
    
    # Testing Mistral - RETRY
    model = "mistralai/mistral-7b-instruct:free" 
    print(f"Testing {model}...")
    
    try:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000", 
            },
            data=json.dumps({
                "model": model,
                "messages": [
                    {"role": "user", "content": "Hello"}
                ]
            }),
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_simple()
