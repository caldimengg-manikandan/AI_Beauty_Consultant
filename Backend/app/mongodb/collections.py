from app.mongodb.client import db

analysis_collection = db["analysis_results"]
appointments_collection = db["appointments"]
users_collection = db["users"]
settings_collection = db["settings"]
salons_collection = db["salons"]
reviews_collection = db["salon_reviews"]
slot_bookings_collection = db["slot_bookings"]
