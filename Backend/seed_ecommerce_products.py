import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["ai_beauty_db"]
inventory_collection = db["inventory"]

products = [
    {
        "item_name": "Luminous Glow Hydrating Cleanser",
        "category": "Retail",
        "sku": "LGC-001",
        "unit_price": 1250,
        "quantity_in_stock": 50,
        "salon_id": None,
    },
    {
        "item_name": "Advanced Vitamin C+ Serum",
        "category": "Retail",
        "sku": "VCS-002",
        "unit_price": 3200,
        "quantity_in_stock": 30,
        "salon_id": None,
    },
    {
        "item_name": "Invisible Shield SPF 50+",
        "category": "Retail",
        "sku": "SPF-003",
        "unit_price": 1850,
        "quantity_in_stock": 100,
        "salon_id": None,
    },
    {
        "item_name": "Restorative Night Ceramide Cream",
        "category": "Retail",
        "sku": "RNC-004",
        "unit_price": 2800,
        "quantity_in_stock": 45,
        "salon_id": None,
    },
    {
        "item_name": "AHA/BHA Exfoliating Toner",
        "category": "Retail",
        "sku": "AHA-005",
        "unit_price": 1600,
        "quantity_in_stock": 60,
        "salon_id": None,
    },
    {
        "item_name": "Deep Hydration Hyaluronic Acid",
        "category": "Retail",
        "sku": "HYA-006",
        "unit_price": 2100,
        "quantity_in_stock": 75,
        "salon_id": None,
    }
]

for prod in products:
    existing = inventory_collection.find_one({"sku": prod["sku"]})
    if not existing:
        inventory_collection.insert_one(prod)
        print(f"Inserted: {prod['item_name']}")
    else:
        print(f"Already exists: {prod['item_name']}")

print("Database seeding completed successfully.")
