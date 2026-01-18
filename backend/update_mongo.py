import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json
from pathlib import Path
from datetime import datetime

async def update_mongo():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.divergence
    
    user_id = '696c8e2f04fdddb47db2f16a'
    
    # Load filtered data
    filtered_data = json.loads((Path('translation') / user_id / 'filtered.json').read_text())
    
    # Update MongoDB
    result = await db.github_data_collection.update_one(
        {'user_id': user_id},
        {
            '$set': {
                'user_id': user_id,
                'username': 'GitShard1',
                'filtered_data': filtered_data,
                'processed_at': datetime.utcnow()
            }
        },
        upsert=True
    )
    
    print('✓ Updated MongoDB with new filtered data')
    print(f'  Matched: {result.matched_count}, Modified: {result.modified_count}')
    
    client.close()

if __name__ == '__main__':
    asyncio.run(update_mongo())
