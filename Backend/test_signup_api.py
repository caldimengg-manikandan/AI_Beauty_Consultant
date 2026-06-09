import requests

url = "http://localhost:8000/api/auth/customer/signup"
data = {
    "email": "test_bot_555@gmail.com",
    "password": "password123",
    "name": "Test Bot",
    "phone": "1234567890"
}

try:
    response = requests.post(url, json=data)
    print("Status Code:", response.status_code)
    print("Response Body:", response.text)
except Exception as e:
    print("Connection error:", str(e))
