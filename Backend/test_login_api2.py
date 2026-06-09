import requests

url = "http://localhost:8000/api/auth/login"
data = {
    "email": "jasminedorathyvasantharaj@gmail.com",
    "password": "123456",
    "role_type": "customer"
}

response = requests.post(url, json=data)
print("Status Code:", response.status_code)
with open("login_error.txt", "w", encoding="utf-8") as f:
    f.write(response.text)
