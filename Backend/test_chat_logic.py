import requests
import json
import time
import os

def load_api_key():
    try:
        with open(".env", "r") as f:
            for line in f:
                if line.startswith("OPENROUTER_API_KEY"):
                    return line.strip().split("=")[1]
    except Exception as e:
        print(f"Error reading .env: {e}")
        return None
    return None

def test_chat():
    api_key = load_api_key()
    if not api_key:
        print("❌ Error: Could not load OPENROUTER_API_KEY from .env")
        return

    print(f"✅ Loaded API Key: {api_key[:5]}...{api_key[-4:]}")

    # Copy of the logic from routes.py
    models_to_try = [
        "google/gemini-2.0-flash-exp:free", 
        "meta-llama/llama-3-8b-instruct:free",
        "microsoft/phi-3-mini-128k-instruct:free",
        "mistralai/mistral-7b-instruct:free",
        "huihui-ai/qwen-2.5-7b-instruct:free",
        "openchat/openchat-7b:free"
    ]

    msg = "Hello! Who are you?"
    system_prompt = "You are an elite AI Beauty Consultant."
    
    last_error = ""

    print("\n🚀 Starting Chat Test...")

    for model in models_to_try:
        try:
            print(f"🤖 Trying AI Model: {model}...")
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
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": msg}
                    ]
                }),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'choices' in data and len(data['choices']) > 0:
                    ai_reply = data['choices'][0]['message']['content']
                    print(f"\n✅ SUCCESS! received reply from {model}:")
                    print("-" * 40)
                    print(ai_reply)
                    print("-" * 40)
                    return
            
            error_msg = response.text
            last_error = f"Model {model} failed ({response.status_code}): {error_msg}"
            print(f"⚠️ {last_error}")
            
            if response.status_code == 429:
                print("⏳ Rate limited (429). Sleeping 1s before next model...")
                time.sleep(1) 
                
        except Exception as e:
            last_error = f"Model {model} exception: {str(e)}"
            print(f"⚠️ {last_error}")
            continue

    print(f"\n❌ All models failed. Last error: {last_error}")

if __name__ == "__main__":
    test_chat()
