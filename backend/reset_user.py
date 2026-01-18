from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_USERNAME = os.getenv("MONGO_USERNAME")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD")
uri = f"mongodb+srv://{MONGO_USERNAME}:{MONGO_PASSWORD}@cluster0.ncuqrpz.mongodb.net/"

client = MongoClient(uri, tlsAllowInvalidCertificates=True)
db = client.divergence

# Reset the processed flag for GitShard1
result = db.users.update_one(
    {'username': 'GitShard1'},
    {'$set': {'github_processed': False}}
)

print(f"Reset github_processed flag for GitShard1")
print(f"Modified count: {result.modified_count}")

client.close()
