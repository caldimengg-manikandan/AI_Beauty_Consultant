import os
from pymongo import MongoClient

# 1. Connect to your LOCAL database (the one with your 51 users)
local_client = MongoClient("mongodb://localhost:27017")
local_db = local_client["ai_beauty_db"]

# 2. Connect to your NEW CLOUD database
# We include tlsAllowInvalidCertificates=true to prevent the SSL error
cloud_uri = "mongodb+srv://jasminedorathyvasantharaj_db_user:Jasmine1522@cluster0.llmmx89.mongodb.net/ai_beauty_db?tlsAllowInvalidCertificates=true"
cloud_client = MongoClient(cloud_uri)
cloud_db = cloud_client["ai_beauty_db"]

print("Starting Migration from Local to Cloud...")

# 3. Loop through every collection in your local database and copy the data
collections = local_db.list_collection_names()

for collection_name in collections:
    print(f"Migrating collection: {collection_name}...")
    local_data = list(local_db[collection_name].find())
    
    if len(local_data) > 0:
        # Clear any existing data in the cloud collection just in case
        cloud_db[collection_name].delete_many({})
        # Insert all local data into the cloud
        cloud_db[collection_name].insert_many(local_data)
        print(f"   -> Successfully copied {len(local_data)} documents.")
    else:
        print(f"   -> Collection is empty, skipping.")

print("\n✅ Migration Complete! Your cloud database now has all your original data.")
