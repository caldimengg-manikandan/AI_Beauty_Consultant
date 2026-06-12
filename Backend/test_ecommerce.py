from fastapi.testclient import TestClient
from app.main import app
from app.auth.jwt_handler import create_access_token

client = TestClient(app)

# Create a fake token
token = create_access_token({"email": "test@example.com", "_id": "64abcdef1234567890abcdef"})
headers = {"Authorization": f"Bearer {token}"}

print("Testing /api/ecommerce/products...")
res = client.get("/api/ecommerce/products")
print(res.status_code, res.text)

print("\nTesting /api/ecommerce/cart...")
res = client.get("/api/ecommerce/cart", headers=headers)
print(res.status_code, res.text)

print("\nTesting /api/ecommerce/orders...")
res = client.get("/api/ecommerce/orders", headers=headers)
print(res.status_code, res.text)
