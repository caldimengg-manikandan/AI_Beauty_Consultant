import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
uri = os.getenv("MONGO_URI")

try:
    print(f"Testing connection to: {uri}")
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    # The ismaster command is cheap and does not require auth.
    client.admin.command('ismaster')
    print("✅ Connection Successful! No SSL errors.")
except Exception as e:
    print(f"❌ Connection Failed: {e}")
