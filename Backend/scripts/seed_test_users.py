from app.mongodb.user_collection import user_collection
from app.auth.security import hash_password
from datetime import datetime

# List existing users
users = list(user_collection.find({}, {"email": 1, "role": 1, "name": 1, "_id": 0}))
print("=== EXISTING USERS ===")
for u in users:
    print(f"  {u.get('role','user'):<14} | {u.get('name',''):<20} | {u.get('email','?')}")
print(f"Total: {len(users)} users\n")

# Create test users for each role if they don't exist
TEST_USERS = [
    {"email": "admin@test.com",      "name": "Admin User",      "role": "admin",      "account_type": "customer"},
    {"email": "expert@test.com",     "name": "Expert User",     "role": "expert",     "account_type": "customer"},
    {"email": "shopowner@test.com",  "name": "Shop Owner User", "role": "shop_owner", "account_type": "shop_owner"},
    {"email": "premium@test.com",    "name": "Premium User",    "role": "premium",    "account_type": "customer"},
    {"email": "freeuser@test.com",   "name": "Free User",       "role": "user",       "account_type": "customer"},
]

print("=== CREATING TEST USERS ===")
for u in TEST_USERS:
    exists = user_collection.find_one({"email": u["email"]})
    if not exists:
        user_collection.insert_one({
            **u,
            "password": hash_password("Test@1234"),
            "created_at": datetime.utcnow(),
        })
        print(f"  CREATED: {u['role']:<14} | {u['email']}")
    else:
        # Update role in case it changed
        user_collection.update_one({"email": u["email"]}, {"$set": {"role": u["role"], "account_type": u["account_type"]}})
        print(f"  EXISTS:  {u['role']:<14} | {u['email']}")

print("\n=== TEST CREDENTIALS (all password: Test@1234) ===")
for u in TEST_USERS:
    print(f"  {u['role']:<14} => {u['email']}")
