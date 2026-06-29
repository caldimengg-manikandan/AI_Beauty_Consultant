import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Use Environment Variable for production, fallback to local for dev
MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URL") or "mongodb://localhost:27017"

client = MongoClient(MONGO_URI)
# Hardcoding "ai_beauty_db" meant every deployment shared the same DB name
# regardless of environment (no easy way to point staging/prod/local at
# different databases on the same cluster). Now configurable via
# MONGODB_DB_NAME, defaulting to "ai_beauty_db" so existing deployments that
# don't set it keep using the exact same database as before.
DB_NAME = os.getenv("MONGODB_DB_NAME", "ai_beauty_db")
db = client[DB_NAME]
