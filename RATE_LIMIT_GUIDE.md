# Rate Limit Protection

## How It Works

The system now includes multiple layers of rate limit protection:

### 1. **Data Caching (7 days)**
- User data is cached for 7 days after processing
- Prevents re-fetching GitHub data on every login
- Automatically re-processes after 7 days if needed

### 2. **GitHub API Rate Limits**
- **Without token**: 60 requests/hour
- **With token**: 5,000 requests/hour

### 3. **Setting Up GitHub Token (Recommended)**

To avoid rate limits, set up a GitHub Personal Access Token:

#### Step 1: Create Token
1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name (e.g., "Divergence App")
4. Set expiration (recommend 90 days or No expiration for testing)
5. Select scopes:
   - ✅ `public_repo` (read public repositories)
   - ✅ `read:user` (read user profile data)
6. Click "Generate token"
7. **Copy the token immediately** (you won't see it again!)

#### Step 2: Add to .env File
In your `.env` file in the `backend` folder, add:

```env
GITHUB_PERSACCESS_TOKEN=ghp_your_token_here
```

#### Step 3: Restart Backend
```bash
# Stop the backend (Ctrl+C) and restart:
uvicorn main:app --reload
```

### 4. **Manual Cache Reset**

If you need to force re-processing (e.g., after making new repos):

**Option 1: Wait 7 days** - automatic re-processing

**Option 2: Manual reset** - run this Python script:
```python
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
uri = f"mongodb+srv://{os.getenv('MONGO_USERNAME')}:{os.getenv('MONGO_PASSWORD')}@cluster0.ncuqrpz.mongodb.net/"
client = MongoClient(uri, tlsAllowInvalidCertificates=True)
db = client.divergence

# Reset for your username
db.users.update_one(
    {'username': 'YourGitHubUsername'},
    {'$set': {'github_processed': False}}
)
print("Cache cleared - re-login to trigger processing")
client.close()
```

### 5. **Rate Limit Status**

The system now shows rate limit information in console:
- Remaining API calls
- Reset time if limit is close
- Warnings when < 10 requests remain

### Current Cache Settings

| Setting | Value |
|---------|-------|
| Cache Duration | 7 days |
| Repos Fetched | 5 per user |
| API Timeout | 10 seconds |

To change cache duration, edit `check_and_process_user_data()` in `backend/main.py`:
```python
if age.days < 7:  # Change 7 to your preferred days
```
