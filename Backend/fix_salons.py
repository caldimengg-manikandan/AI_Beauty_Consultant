import os
from pymongo import MongoClient

def fix_db():
    print("Fixing Salons in DB ai_beauty_db...")
    client = MongoClient("mongodb://localhost:27017")
    db = client["ai_beauty_db"]
    salons_collection = db["salons"]
    
    # Coordinates for common cities
    coords = {
        "chennai": (13.0827, 80.2707),
        "bangalore": (12.9716, 77.5946),
        "mumbai": (19.0760, 72.8777),
        "hyderabad": (17.3850, 78.4867),
        "pune": (18.5204, 73.8567),
        "delhi": (28.7041, 77.1025),
        "kolkata": (22.5726, 88.3639)
    }
    
    salons = list(salons_collection.find())
    for s in salons:
        updates = {}
        if not s.get("is_verified"):
            updates["is_verified"] = True
        
        if s.get("latitude") is None or s.get("longitude") is None:
            city = s.get("city", "").lower()
            lat, lon = coords.get(city, (20.5937, 78.9629))
            updates["latitude"] = lat
            updates["longitude"] = lon
            
        if updates:
            salons_collection.update_one({"_id": s["_id"]}, {"$set": updates})
            print(f"Updated {s.get('name')} with {updates}")

if __name__ == "__main__":
    fix_db()
