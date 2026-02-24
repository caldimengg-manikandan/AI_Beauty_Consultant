from app.mongodb.user_collection import user_collection
from app.auth.security import hash_password

def create_default_admin():
    email = "admin@beauty.com"
    password = "AdminPassword123!"
    
    # Check if exists
    existing = user_collection.find_one({"email": email})
    if existing:
        user_collection.delete_one({"email": email})
        
    user_doc = {
        "email": email,
        "password": hash_password(password),
        "role": "admin",
        "status": "active"
    }
    
    user_collection.insert_one(user_doc)
    print(f"✅ NEW ADMIN CREATED")
    print(f"Email: {email}")
    print(f"Password: {password}")

if __name__ == "__main__":
    create_default_admin()
