"""
Product and Ingredient Intelligence Database
"""
from app.mongodb.client import db
from datetime import datetime

products_collection = db["products"]
ingredients_db = db["ingredients"]

# Sample Premium Product Data
INITIAL_PRODUCTS = [
    {
        "name": "Hyaluronic Cloud Hydrator",
        "brand": "AquaGlow",
        "category": "Moisturizer",
        "skin_types": ["dry", "combination"],
        "concerns": ["dehydration", "fine lines"],
        "ingredients": ["Hyaluronic Acid", "Ceramides", "Glycerin"],
        "price": 45.00,
        "rating": 4.8
    },
    {
        "name": "Sebum Control Serum",
        "brand": "MatteLab",
        "category": "Serum",
        "skin_types": ["oily", "acne-prone"],
        "concerns": ["excess oil", "enlarged pores"],
        "ingredients": ["Niacinamide", "Zinc PCA", "Salicylic Acid"],
        "price": 32.00,
        "rating": 4.5
    },
    {
        "name": "Gentle Oatmeal Cleanser",
        "brand": "PureEase",
        "category": "Cleanser",
        "skin_types": ["sensitive", "all"],
        "concerns": ["redness", "irritation"],
        "ingredients": ["Colloidal Oatmeal", "Aloe Vera", "Panthenol"],
        "price": 24.00,
        "rating": 4.9
    }
]

# Clinical Ingredient Intelligence
INGREDIENT_RULES = {
    "Salicylic Acid": {
        "benefit": "Exfoliates pores, reduces acne",
        "risk_for": ["dry", "extremely sensitive"],
        "best_for": ["oily", "acne-prone"]
    },
    "Hyaluronic Acid": {
        "benefit": "Deep hydration, plumping",
        "risk_for": [],
        "best_for": ["dry", "dehydrated", "aging"]
    },
    "Niacinamide": {
        "benefit": "Refines pores, brightens skin",
        "risk_for": [],
        "best_for": ["oily", "enlarged pores", "uneven tone"]
    }
}

def seed_product_db():
    if products_collection.count_documents({}) == 0:
        products_collection.insert_many(INITIAL_PRODUCTS)
        print("✅ Product Database Seeded")

if __name__ == "__main__":
    seed_product_db()
