from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_USERNAME = os.getenv("MONGO_USERNAME")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD")
uri = f"mongodb+srv://{MONGO_USERNAME}:{MONGO_PASSWORD}@cluster0.ncuqrpz.mongodb.net/"

client = MongoClient(uri, tlsAllowInvalidCertificates=True)
db = client.divergence

user = db.users.find_one({'username': 'GitShard1'})
if user:
    print(f"User: {user.get('username')}")
    print(f"User ID: {user.get('_id')}")
    print(f"GitHub processed: {user.get('github_processed', False)}")
    print(f"Avatar: {user.get('avatar_url', 'N/A')}")
else:
    print("User not found in database")

client.close()
