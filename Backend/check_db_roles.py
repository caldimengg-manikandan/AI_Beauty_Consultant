from app.mongodb.user_collection import user_collection

def check_users():
    users = list(user_collection.find({}, {"email": 1, "role": 1}))
    print("User Roles in DB:")
    for u in users:
        print(f"Email: {u.get('email')}, Role: {u.get('role')}")

if __name__ == "__main__":
    check_users()
