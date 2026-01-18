#!/usr/bin/env python3
import os
import sys
import shutil
import subprocess
import requests
from pathlib import Path

# Optional: Use a GitHub token to increase API rate limits
GITHUB_TOKEN = os.getenv('GITHUB_PERSACCESS_TOKEN')

# Files to EXCLUDE
EXCLUDE_FILES = {
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb',
    'Cargo.lock', 'Gemfile.lock', 'composer.lock', 'poetry.lock',
    'Pipfile.lock', 'go.sum', 'Podfile.lock', '.DS_Store', 'Thumbs.db'
}

# Important files to always include
IMPORTANT_FILENAMES = {
    'dockerfile', 'makefile', 'procfile', 'gemfile',
    'package.json', 'requirements.txt', 'pom.xml', 
    'build.gradle', 'build.sbt', 'cargo.toml', 'go.mod',
    'composer.json', 'setup.py', 'pyproject.toml', 'manage.py',
    'webpack.config.js', 'tsconfig.json', 'next.config.js',
    'next.config.ts', 'tailwind.config.js', 'tailwind.config.ts',
    'vite.config.js', 'vite.config.ts'
}

# Directories to exclude
EXCLUDE_DIRS = {
    'node_modules', '.next', '.nuxt', 'dist', 'build', 'out',
    '.output', '.cache', '.parcel-cache', '.eslintcache',
    '.vscode', '.idea', '__pycache__', '.pytest_cache',
    '.venv', 'venv', 'env', 'virtualenv', '.git',
    '.github/workflows', 'target', 'vendor'
}

def should_skip_directory(path):
    """Check if directory should be skipped"""
    path_parts = Path(path).parts
    return any(part in EXCLUDE_DIRS for part in path_parts)

def is_code_file(filename, filepath=""):
    """Check if file should be included"""
    filename_lower = filename.lower()
    
    # Skip excluded files (STRICT - no exceptions)
    if filename_lower in EXCLUDE_FILES:
        return False
    
    # Check by filename (important config files)
    if filename_lower in IMPORTANT_FILENAMES:
        return True
    
    # Check if it's a Dockerfile or Makefile
    if 'dockerfile' in filename_lower or 'makefile' in filename_lower:
        return True
    
    # Only include files with valid code extensions
    valid_extensions = {
        '.py', '.js', '.java', '.cpp', '.h', '.md', '.txt',
        '.json', '.yml', '.yaml', '.toml', '.rs', '.go',
        '.html', '.css', '.ts', '.jsx', '.tsx', '.c', '.hpp',
        '.cs', '.php', '.rb', '.swift', '.kt', '.scala', '.sh',
        '.bat', '.ps1', '.sql', '.xml', '.csv', '.ini', '.cfg',
        '.conf', '.sql', '.gitignore', '.env', '.dockerfile'
    }
    
    _, ext = os.path.splitext(filename_lower)
    return ext in valid_extensions

def extract_username_and_repo(profile_or_repo_url):
    """Extract username and repository name from a GitHub URL"""
    url = profile_or_repo_url.replace("https://", "").replace("http://", "")
    url = url.rstrip('/')
    
    parts = url.split('/')
    
    if len(parts) == 2:
        print("Given profile URL, getting all repos")
        return parts[1], "ALL"
    elif len(parts) >= 3:
        print("Given repo URL")
        if len(parts) > 3:
            print(f"Note: URL contains extra path, using {parts[1]}/{parts[2]}")
        return parts[1], parts[2]
    else:
        raise ValueError("Invalid GitHub URL format")

def fetch_all_repos_for_user(username, max_repos=5):
    """Fetch repositories for a user using GitHub API"""
    url = f"https://api.github.com/users/{username}/repos"
    params = {
        'page': 1,
        'per_page': max_repos,
        'sort': 'pushed',
        'direction': 'desc'
    }
    
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "GitHub-Fetcher/2.0"
    }
    
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
    
    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        if response.status_code != 200:
            print(f"Error fetching repos: {response.status_code}")
            return []
        
        repos = response.json()
        all_repos = []
        
        for repo in repos[:max_repos]:
            repo_info = {
                'name': repo['name'],
                'clone_url': repo['clone_url'],
                'description': repo['description'] or 'No description',
                'language': repo['language'] or 'Not specified'
            }
            all_repos.append(repo_info)
        
        print(f"Fetched {len(all_repos)} repositories for {username}")
        return all_repos
            
    except Exception as e:
        print(f"Error fetching repos: {e}")
        return []

def clone_repo(clone_url, dest_dir):
    """Clone a Git repository to a destination directory"""
    try:
        print(f"Cloning {clone_url}...")
        subprocess.run(
            ['git', 'clone', '--depth', '1', clone_url, dest_dir],
            check=True,
            capture_output=True,
            text=True
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error cloning repository: {e.stderr}")
        return False

def process_local_repo(repo_path, output_file, repo_name):
    """Process a locally cloned repository"""
    processed_files = []
    
    with open(output_file, 'a', encoding='utf-8') as f:
        f.write(f"\n{'='*80}\n")
        f.write(f"REPOSITORY: {repo_name}\n")
        f.write(f"{'='*80}\n\n")
    
    # Walk through the repository
    for root, dirs, files in os.walk(repo_path):
        # Remove excluded directories from traversal
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        rel_root = os.path.relpath(root, repo_path)
        
        # Skip if current directory should be excluded
        if should_skip_directory(rel_root):
            continue
        
        for filename in files:
            filepath = os.path.join(root, filename)
            rel_filepath = os.path.relpath(filepath, repo_path)
            
            if is_code_file(filename, rel_filepath):
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as file_content:
                        content = file_content.read()
                    
                    with open(output_file, 'a', encoding='utf-8') as f:
                        f.write(f"\n{'='*80}\n")
                        f.write(f"FILE: {rel_filepath}\n")
                        f.write(f"{'='*80}\n\n")
                        f.write(content)
                        f.write("\n\n")
                    
                    processed_files.append(rel_filepath)
                    print(f"Processed: {rel_filepath}")
                    
                except Exception as e:
                    print(f"Error reading {rel_filepath}: {e}")
    
    return processed_files

def fetch_github_repo(profile_or_repo_url):
    """Main function to fetch GitHub repositories"""
    username, repo = extract_username_and_repo(profile_or_repo_url)
    
    output_file = "RESULTS.txt"
    temp_dir = "temp_repos"
    
    try:

        # failsafe clean
        if os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
                print(f"Cleaned up existing {temp_dir} directory")
            except Exception as e:
                print(f"Warning: Could not clean up existing {temp_dir}: {e}")
        
        # Create temp directory for clones
        os.makedirs(temp_dir, exist_ok=True)
        
        
        # Determine which repos to process
        repos_to_process = []
        
        if repo == "ALL":
            repos_info = fetch_all_repos_for_user(username, max_repos=5)
            repos_to_process = [(r['name'], r['clone_url']) for r in repos_info]
        else:
            clone_url = f"https://github.com/{username}/{repo}.git"
            repos_to_process = [(repo, clone_url)]
        
        # Clear output file
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"GitHub Repositories Dump\n")
            f.write(f"User: {username}\n")
            f.write(f"{'='*80}\n\n")
        
        total_files = 0
        
        # Process each repository
        for repo_name, clone_url in repos_to_process:
            repo_dir = os.path.join(temp_dir, repo_name)
            
            # Clone the repository
            if clone_repo(clone_url, repo_dir):
                # Process the cloned repository
                files = process_local_repo(repo_dir, output_file, repo_name)
                total_files += len(files)
                print(f"Processed {len(files)} files from {repo_name}")
            else:
                print(f"Skipping {repo_name} due to clone failure")
            
            # Always clean up the repo directory after processing (success or failure)
            if os.path.exists(repo_dir):
                try:
                    shutil.rmtree(repo_dir, ignore_errors=True)
                except Exception as e:
                    print(f"Warning: Error cleaning {repo_dir}: {e}")
        
        print(f"\nDone! Saved {total_files} files to {output_file}")
        return output_file
        
    finally:
        # Ensure temp directory is cleaned up with aggressive retry logic
        import time
        time.sleep(1)  # Give file handles time to close
        
        if os.path.exists(temp_dir):
            # Retry multiple times to handle file locks
            for attempt in range(5):
                try:
                    # First, try to remove read-only attributes (Windows issue)
                    for root, dirs, files in os.walk(temp_dir, topdown=False):
                        for name in files:
                            filepath = os.path.join(root, name)
                            try:
                                os.chmod(filepath, 0o777)
                            except:
                                pass
                        for name in dirs:
                            dirpath = os.path.join(root, name)
                            try:
                                os.chmod(dirpath, 0o777)
                            except:
                                pass
                    
                    # Now try to remove the directory
                    shutil.rmtree(temp_dir, ignore_errors=False)
                    print(f"✓ Fully cleaned up {temp_dir}")
                    break
                except Exception as e:
                    if attempt < 4:
                        print(f"Cleanup attempt {attempt + 1} failed, retrying... ({e})")
                        time.sleep(1)
                    else:
                        print(f"Warning: Could not fully clean up {temp_dir} after 5 attempts: {e}")

if __name__ == "__main__":
    # print("HELPPPPPPPPPPPPPPP")
    # print(sys.argv)
    if len(sys.argv) != 2:
        print("Usage: python GithubFetchPython.py '[REPO OR GITHUB PROFILE URL]'")
        sys.exit(1)
    
    profile_or_repo_url = sys.argv[1]
    fetch_github_repo(profile_or_repo_url)