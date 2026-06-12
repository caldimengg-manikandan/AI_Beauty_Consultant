import os
import sys
from pymongo import MongoClient

def check_db():
    print("Checking Salons in DB ai_beauty_db...")
    client = MongoClient("mongodb://localhost:27017")
    db = client["ai_beauty_db"]
    salons_collection = db["salons"]
    
    salons = list(salons_collection.find())
    print(f"Total salons: {len(salons)}")
    for s in salons:
        print(f"- {s.get('name')} | Verified: {s.get('is_verified')} | Active: {s.get('is_active')} | Lat: {s.get('latitude')} | Lon: {s.get('longitude')}")

if __name__ == "__main__":
    check_db()
