
from pymongo import MongoClient
import sys

MONGO_URI = "mongodb://localhost:27017"

def check_db():
    print(f"Connecting to MongoDB at {MONGO_URI}...")
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        # Force a connection
        client.admin.command('ping')
        print("✅ MongoDB Connection Successful!")
        return True
    except Exception as e:
        print(f"❌ MongoDB Connection Failed: {e}")
        return False

if __name__ == "__main__":
    success = check_db()
    if not success:
        sys.exit(1)
