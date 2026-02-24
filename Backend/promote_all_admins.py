from app.mongodb.user_collection import user_collection
import sys

def promote_to_admin():
    try:
        result = user_collection.update_many({}, {"$set": {"role": "admin"}})
        print(f"SUCCESS: Updated {result.modified_count} users to 'admin' role.")
        print("You should now see the 'Management' section in your Sidebar after logging in again.")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    promote_to_admin()
