import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Use Environment Variable for production, fallback to local for dev
MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URL") or "mongodb://localhost:27017"

client = MongoClient(MONGO_URI)
db = client["ai_beauty_db"]
