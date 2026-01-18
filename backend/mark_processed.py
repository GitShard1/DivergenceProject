from pymongo import MongoClient
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

MONGO_USERNAME = os.getenv("MONGO_USERNAME")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD")
uri = f"mongodb+srv://{MONGO_USERNAME}:{MONGO_PASSWORD}@cluster0.ncuqrpz.mongodb.net/"

client = MongoClient(uri, tlsAllowInvalidCertificates=True)
db = client.divergence

# Mark GitShard1 as processed
result = db.users.update_one(
    {'username': 'GitShard1'},
    {'$set': {'github_processed': True, 'processed_at': datetime.utcnow()}}
)

print(f"Marked GitShard1 as processed")
print(f"Modified count: {result.modified_count}")

client.close()
