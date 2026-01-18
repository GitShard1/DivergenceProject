import sys
from pathlib import Path

# Add current directory to path so we can import from main
sys.path.insert(0, str(Path(__file__).parent))

from main import process_github_user_main

# Manually trigger processing for GitShard1
username = "GitShard1"
user_id = "696c8e2f04fdddb47db2f16a"

print(f"Manually processing {username} with user_id {user_id}...")
try:
    result = process_github_user_main(username, user_id)
    print("Processing completed successfully!")
    print(result)
except Exception as e:
    print(f"Error during processing: {e}")
    import traceback
    traceback.print_exc()
