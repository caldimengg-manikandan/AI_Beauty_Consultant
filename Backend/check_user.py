from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["ai_beauty_db"]
user_collection = db["users"]

email = "jasminedorathyvasantharaj@gmail.com"
user = user_collection.find_one({"email": email})

if user:
    print(f"User found: {user['email']}")
    print(f"Role: {user.get('role')}")
    # Don't print the hashed password for security, but check if it exists
    if 'password' in user:
        print("Password hash exists.")
else:
    print(f"User {email} not found.")

# List all users
print("\nAll users in DB:")
for u in user_collection.find():
    print(f"- {u['email']}")
