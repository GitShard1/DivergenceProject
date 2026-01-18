import json
import re
from collections import defaultdict
from datetime import datetime
import statistics
from pathlib import Path

def analyze_github_dump(text):
    """Analyze the GitHub repository dump and create both filtered and translated outputs"""
    
    # Parse the dump into repository sections
    repos = parse_repositories(text)
    
    # Create filtered data
    filtered_data = create_filtered_data(repos)
    
    # Create translated profile
    translated_data = create_translated_data(filtered_data)
    
    return filtered_data, translated_data

def parse_repositories(text):
    """Parse the GitHub dump into individual repositories"""
    repos = []
    
    # Split by repository markers
    repo_sections = re.split(r'={80}\nREPOSITORY:\s*(.+?)\n={80}', text)
    
    # Process each repository (skip first section which is header)
    for i in range(1, len(repo_sections), 2):
        if i + 1 < len(repo_sections):
            repo_name = repo_sections[i].strip()
            repo_content = repo_sections[i + 1]
            
            repos.append({
                'name': repo_name,
                'content': repo_content
            })
    
    return repos

def create_filtered_data(repos):
    """Create filtered.json structure"""
    repositories = []
    all_commits = []
    
    for repo_data in repos:
        repo_info = analyze_single_repo(repo_data['name'], repo_data['content'])
        repositories.append(repo_info)
        all_commits.extend(repo_info['commits'])
    
    return {
        'repositories': repositories,
        'total_commits': len(all_commits),
        'commit_dates': sorted([c['date'] for c in all_commits if c.get('date')])
    }

def analyze_single_repo(name, content):
    """Analyze a single repository"""
    
    # Detect languages
    languages = detect_languages(content)
    
    # Detect libraries (with frequency)
    libraries = detect_libraries(content)
    
    # Detect frameworks
    frameworks = detect_frameworks(content)
    
    # Parse commits (if available)
    commits = parse_commits(content)
    
    # Estimate size
    size_kb = len(content) / 1024
    
    # Analyze file types
    file_types = analyze_file_types(content)
    
    # Estimate test coverage
    test_coverage = estimate_test_coverage(content)
    
    return {
        'name': name,
        'languages': languages,
        'libraries': libraries,
        'frameworks': frameworks,
        'commits': commits,
        'size_kb': round(size_kb, 2),
        'file_types': file_types,
        'test_coverage': test_coverage
    }

def detect_languages(text):
    """Detect programming languages from file extensions"""
    languages = defaultdict(int)
    
    patterns = {
        'Python': r'\.py\b',
        'JavaScript': r'\.js\b',
        'TypeScript': r'\.ts\b',
        'Shell': r'\.sh\b',
        'JSON': r'\.json\b',
        'Markdown': r'\.md\b',
        'YAML': r'\.yml\b|\.yaml\b',
        'HTML': r'\.html\b',
        'CSS': r'\.css\b',
    }
    
    for lang, pattern in patterns.items():
        matches = len(re.findall(pattern, text, re.IGNORECASE))
        if matches > 0:
            languages[lang] = matches
    
    return dict(languages)

def detect_libraries(text):
    """Detect libraries with frequency counts"""
    libraries = defaultdict(int)
    
    # Python imports
    py_imports = re.findall(r'(?:import|from)\s+([a-zA-Z0-9_.-]+)', text)
    for lib in py_imports:
        base_lib = lib.split('.')[0]
        libraries[base_lib] += 1
    
    # Package names from JSON
    # Look for common package manager patterns
    package_names = re.findall(r'"([a-zA-Z0-9_-]+)":\s*"\d+\.\d+\.\d+"', text)
    for pkg in package_names:
        libraries[pkg] += 1
    
    # Filter out very common/standard items
    filtered = {lib: count for lib, count in libraries.items() 
               if len(lib) > 2 and lib not in ['sys', 'os', 'io', 're']}
    
    return dict(sorted(filtered.items(), key=lambda x: x[1], reverse=True)[:30])

def detect_frameworks(text):
    """Detect frameworks"""
    frameworks = set()
    
    patterns = {
        'pytest': r'\bpytest\b',
        'GitHub Actions': r'\.github/workflows',
        'Git': r'\bgit\b',
        'Docker': r'\bdocker\b',
        'Claude Code': r'\bclaude.code\b|claude-plugin',
        'Ollama': r'\bollama\b',
        'MCP': r'\bmcp\b',
    }
    
    for framework, pattern in patterns.items():
        if re.search(pattern, text, re.IGNORECASE):
            frameworks.add(framework)
    
    return sorted(list(frameworks))

def parse_commits(text):
    """Parse commit information"""
    commits = []
    
    # Look for date patterns in the content
    date_patterns = re.findall(r'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})', text)
    
    for date_str in date_patterns[:100]:  # Limit to avoid over-counting
        try:
            timestamp = datetime.fromisoformat(date_str.replace('Z', '+00:00')).timestamp()
            commits.append({
                'date': date_str,
                'timestamp': timestamp
            })
        except:
            continue
    
    return commits

def analyze_file_types(text):
    """Analyze file type distribution"""
    file_types = defaultdict(int)
    
    # Match file extensions
    extensions = re.findall(r'\.([a-zA-Z0-9]+)\b', text)
    for ext in extensions:
        file_types[ext.lower()] += 1
    
    return dict(sorted(file_types.items(), key=lambda x: x[1], reverse=True)[:20])

def estimate_test_coverage(text):
    """Estimate test coverage"""
    test_indicators = [
        r'\btest[_-]',
        r'[_-]test\.',
        r'\.test\.',
        r'\bspec/',
        r'\btest/',
        r'\btesting\b',
        r'\bassert\b',
        r'\bpytest\b',
    ]
    
    test_matches = sum(len(re.findall(pattern, text, re.IGNORECASE)) 
                      for pattern in test_indicators)
    
    code_files = len(re.findall(r'\.(py|js|ts|sh)\b', text))
    
    if code_files == 0:
        return 0.0
    
    coverage = min((test_matches / max(code_files, 1)) * 100, 100)
    return round(coverage, 2)

def create_translated_data(filtered_data):
    """Create translated.json from filtered data"""
    
    # Aggregate languages
    language_counts = defaultdict(int)
    for repo in filtered_data['repositories']:
        for lang, count in repo['languages'].items():
            language_counts[lang] += count
    
    total_lang = sum(language_counts.values())
    languages = {lang: round((count / total_lang) * 100, 2) 
                for lang, count in language_counts.items()} if total_lang > 0 else {}
    
    # Aggregate libraries
    library_counts = defaultdict(int)
    for repo in filtered_data['repositories']:
        for lib, count in repo['libraries'].items():
            library_counts[lib] += count
    
    libraries = dict(sorted(library_counts.items(), key=lambda x: x[1], reverse=True))
    
    # Aggregate frameworks
    framework_counts = defaultdict(int)
    for repo in filtered_data['repositories']:
        for fw in repo['frameworks']:
            framework_counts[fw] += 1
    
    frameworks = dict(sorted(framework_counts.items(), key=lambda x: x[1], reverse=True))
    
    # Analyze habits
    all_commits = []
    commit_sizes = []
    for repo in filtered_data['repositories']:
        all_commits.extend(repo['commits'])
        if len(repo['commits']) > 0:
            avg_size = repo['size_kb'] / len(repo['commits'])
            commit_sizes.extend([avg_size] * len(repo['commits']))
    
    timestamps = [c['timestamp'] for c in all_commits if c.get('timestamp')]
    if len(timestamps) > 1:
        time_span_days = (max(timestamps) - min(timestamps)) / 86400
        frequency = len(timestamps) / max(time_span_days / 7, 1) if time_span_days > 0 else 0
    else:
        frequency = 0.0
    
    if len(timestamps) > 2:
        intervals = [timestamps[i+1] - timestamps[i] for i in range(len(timestamps)-1)]
        consistency = 1.0 / (1.0 + statistics.stdev(intervals) / 86400)
    else:
        consistency = 0.0
    
    avg_commit_size = statistics.mean(commit_sizes) if commit_sizes else 0.0
    
    if frequency > 5:
        pattern = 'daily'
    elif frequency > 2:
        pattern = 'regular'
    elif frequency > 0.5:
        pattern = 'weekly'
    else:
        pattern = 'sporadic'
    
    habits = {
        'frequency': round(frequency, 2),
        'consistency': round(consistency, 3),
        'avg_commit_size_kb': round(avg_commit_size, 2),
        'commit_pattern': pattern
    }
    
    # Technical depth
    repo_sizes = [repo['size_kb'] for repo in filtered_data['repositories']]
    avg_size = statistics.mean(repo_sizes) if repo_sizes else 0
    max_size = max(repo_sizes) if repo_sizes else 0
    depth_score = min(avg_size / 500, 1.0)
    
    if depth_score > 0.7:
        level = 'advanced'
    elif depth_score > 0.4:
        level = 'intermediate'
    else:
        level = 'beginner'
    
    technical_depth = {
        'depth_score': round(depth_score, 3),
        'avg_repo_size_kb': round(avg_size, 2),
        'max_repo_size_kb': round(max_size, 2),
        'level': level
    }
    
    # Composition
    frontend_types = {'html', 'css', 'scss', 'sass', 'jsx', 'tsx', 'vue', 'md'}
    backend_types = {'py', 'sh', 'js', 'ts', 'json', 'yml', 'yaml'}
    data_types = {'json', 'csv', 'xml'}
    
    frontend_count = 0
    backend_count = 0
    data_count = 0
    
    for repo in filtered_data['repositories']:
        for file_type, count in repo['file_types'].items():
            if file_type in frontend_types:
                frontend_count += count
            if file_type in backend_types:
                backend_count += count
            if file_type in data_types:
                data_count += count
    
    total = frontend_count + backend_count + data_count
    composition = {
        'frontend': round(frontend_count / total, 3) if total > 0 else 0,
        'backend': round(backend_count / total, 3) if total > 0 else 0,
        'data': round(data_count / total, 3) if total > 0 else 0
    }
    
    # Skills analysis
    skills = {}
    
    all_libs = set()
    all_frameworks = set()
    for repo in filtered_data['repositories']:
        all_libs.update([lib.lower() for lib in repo['libraries'].keys()])
        all_frameworks.update([fw.lower() for fw in repo['frameworks']])
    
    combined = all_libs | all_frameworks
    
    # Developer tools & automation
    devtools_indicators = {'pytest', 'git', 'github', 'docker', 'validation', 'scaffold'}
    skills['devtools_automation'] = len(combined & devtools_indicators) / max(len(devtools_indicators), 1)
    
    # AI/ML
    ai_ml_indicators = {'ollama', 'claude', 'llm', 'ai', 'ml'}
    skills['ai_ml'] = len(combined & ai_ml_indicators) / max(len(ai_ml_indicators), 1)
    
    # Plugin/Extension development
    plugin_indicators = {'plugin', 'marketplace', 'cli', 'tools'}
    skills['plugin_development'] = len(combined & plugin_indicators) / max(len(plugin_indicators), 1)
    
    # Filter and round
    skills = {k: round(v, 3) for k, v in skills.items() if v > 0.05}
    
    # Quality
    coverage_values = [repo['test_coverage'] for repo in filtered_data['repositories']]
    avg_coverage = statistics.mean(coverage_values) if coverage_values else 0
    quality_score = min(avg_coverage / 100, 1.0)
    
    if avg_coverage > 70:
        rating = 'excellent'
    elif avg_coverage > 40:
        rating = 'good'
    elif avg_coverage > 20:
        rating = 'fair'
    else:
        rating = 'needs_improvement'
    
    quality = {
        'avg_test_coverage': round(avg_coverage, 2),
        'quality_score': round(quality_score, 3),
        'rating': rating
    }
    
    return {
        'languages': languages,
        'libraries': libraries,
        'frameworks': frameworks,
        'habits': habits,
        'technical_depth': technical_depth,
        'composition': composition,
        'skills': skills,
        'quality': quality,
        'metadata': {
            'total_repositories': len(filtered_data['repositories']),
            'total_commits': filtered_data['total_commits'],
            'analysis_timestamp': datetime.now().isoformat()
        }
    }

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python analyze_github.py <github_dump.txt>")
        sys.exit(1)
    
    # input_file = sys.argv[1]
    
    # received as str now, so convert back to path
    input_file = Path(sys.argv[1])

    # Read the GitHub dump
    with open(input_file, 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()
    
    # Analyze
    filtered_data, translated_data = analyze_github_dump(text)
    
    # Save filtered.json
    with open('filtered.json', 'w', encoding='utf-8') as f:
        json.dump(filtered_data, f, indent=2)
    print(f"Created filtered.json with {len(filtered_data['repositories'])} repositories")
    
    # Save translated.json
    with open('translated.json', 'w', encoding='utf-8') as f:
        json.dump(translated_data, f, indent=2)
    print(f"Created translated.json")
    print(f"\nDeveloper Profile Summary:")
    print(f"  Top Languages: {list(translated_data['languages'].keys())[:3]}")
    print(f"  Primary Skills: {list(translated_data['skills'].keys())}")
    print(f"  Commit Pattern: {translated_data['habits']['commit_pattern']}")
    print(f"  Technical Level: {translated_data['technical_depth']['level']}")