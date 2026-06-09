from pymongo import MongoClient
from app.auth.security import verify_password

client = MongoClient('mongodb://localhost:27017')
db = client['ai_beauty_db']
user = db['users'].find_one({'email': 'jasminedorathyvasantharaj@gmail.com'})
passwords = ['123456', '12345678', 'password', 'jasminedorathy']
matches = [p for p in passwords if verify_password(p, user['password'])]
print("Matches:", matches)
