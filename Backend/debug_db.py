from app.mongodb.collections import analysis_collection

def check_db():
    pipeline = [{"$group": {"_id": "$face_shape", "count": {"$sum": 1}}}]
    docs = list(analysis_collection.aggregate(pipeline))
    print("Aggregate results:")
    for doc in docs:
        print(doc)

if __name__ == "__main__":
    check_db()
