import os
from pymongo import MongoClient

def check_db():
    client = MongoClient("mongodb://localhost:27017")
    db = client["ai_beauty_db"]
    salons_collection = db["salons"]
    
    salons = list(salons_collection.find())
    for s in salons:
        svc = s.get('services_offered')
        print(f"- {s.get('name')} | services_offered type: {type(svc)} | value: {svc}")

if __name__ == "__main__":
    check_db()
