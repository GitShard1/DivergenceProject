import json
from collections import defaultdict
from datetime import datetime
import statistics
from pathlib import Path

class DeveloperProfile1: 
    def __init__(self, filtered_file):
        self.filtered_file = filtered_file
        self.data = None
    def load_filtereddata(self):
        with open (self.filtered_file, 'r', encoding='utf-8') as f:
            self.data = json.load(f)
    
    def language_aggregation(self):
        count_lang = defaultdict(int)

        #counting language usage throughout each repo
        for repo in self.data['repositories']:
            # Handle both dict and non-dict language formats
            if isinstance(repo.get('languages'), dict):
                for lang, count in repo['languages'].items():
                    count_lang[lang] += int(count)
            elif isinstance(repo.get('languages'), list):
                for lang in repo['languages']:
                    count_lang[lang] += 1
        
        total = sum(count_lang.values())

        #edge case: user does not use any language in repo
        if total == 0:
            return {}
        
        return {lang: round((count/total)*100, 2) for lang, count in count_lang.items()}\
    
    def library_aggregation(self):
        lib_count = defaultdict(int)

        for repo in self.data["repositories"]:
            for lib in repo['libraries']:
                lib_count[lib] += 1

        #libraries sorted by frequency
        sorted_lib = sorted(lib_count.items(), key = lambda x:x[1], reverse=True)

        return {lib: count for lib, count in sorted_lib}
    
    def framework_aggregation(self):
        frame_count = defaultdict(int)

        for repo in self.data["repositories"]:
            for frame in repo['frameworks']:
                frame_count[frame] += 1
        
        sorted_frames = sorted(frame_count.items(), key = lambda x:x[1], reverse=True)

    def analytical_depth(self):
        repo_sizes = [repo['size_kb'] for repo in self.data['repositories']]
        if not repo_sizes:
            return {
                'depth_score' : 0.0,
                'avg_repo_size_kb' : 0.0,
                'level': 'beginner'
            }
        avg_size = statistics.mean(repo_sizes)
        depth_score = min(avg_size/500, 1.0)
        max_size = max(repo_sizes) 

        if depth_score > 0.7:
            level = 'advanced'
        elif depth_score > 0.4:
            level = 'intermediate'
        else: 
            level = 'beginner'

        return {'depth_score': round(depth_score, 3),
                'avg_repo_size': round(avg_size, 2),
                'max_repo_size': round(max_size, 2),
                'level':level
                }
    
    def composition(self):
        frontend_types = {'html', 'css', 'scss', 'sass', 'jsx', 'tsx', 'vue'}
        backend_types = {'py', 'java', 'go', 'rs', 'rb', 'php', 'js', 'ts'}
        data_types = {'sql', 'csv', 'json', 'xml', 'parquet', 'db'}
        
        frontend_count = 0
        backend_count = 0
        data_count = 0

        for repo in self.data['repositories']:
            for file_type, count in repo['file_types'].items():
                if file_type in frontend_types:
                    frontend_count += count
                if file_type in backend_types:
                    backend_count += count
                if file_type in data_types:
                    data_count += count
        
        total = frontend_count + backend_count + data_count
        if total == 0:
            return {
                'frontend': 0.0,
                'backend': 0.0,
                'data' : 0.0
            }
        
        return  {
                'frontend': round(frontend_count / total, 3),
                'backend': round(backend_count / total, 3),
                'data' : round(data_count / total, 3)
            }
    
    def skills(self):
        skills = defaultdict(float)
        
        ai_ml_indicators = {
            'tensorflow', 'pytorch', 'keras', 'sklearn', 'scikit-learn',
            'pandas', 'numpy', 'scipy', 'transformers', 'langchain'
        }
        
        web_dev_indicators = {
            'react', 'vue', 'angular', 'express', 'django', 'flask',
            'fastapi', 'nextjs', 'nestjs', 'rails'
        }
        
        mobile_indicators = {
            'react-native', 'flutter', 'swift', 'kotlin', 'ionic'
        }
        
        cloud_devops_indicators = {
            'docker', 'kubernetes', 'terraform', 'aws', 'azure', 'gcp',
            'ansible', 'jenkins', 'github-actions'
        }
        
        data_engineering_indicators = {
            'spark', 'hadoop', 'airflow', 'kafka', 'dask', 'beam'
        }
        
        cybersecurity_indicators = {
            'cryptography', 'pycrypto', 'requests', 'scapy', 'nmap'
        }
        
        all_libs = set()
        all_frameworks = set()
        
        for repo in self.data['repositories']:
            all_libs.update([lib.lower() for lib in repo['libraries']])
            all_frameworks.update([fw.lower() for fw in repo['frameworks']])
        
        combined = all_libs | all_frameworks
        
        # score each skill area
        skills['ai_ml'] = round(len(combined & ai_ml_indicators) / len(ai_ml_indicators), 3)
        skills['web_development'] = round(len(combined & web_dev_indicators) / len(web_dev_indicators), 3)
        skills['mobile_development'] = round(len(combined & mobile_indicators) / len(mobile_indicators), 3)
        skills['cloud_devops'] = round(len(combined & cloud_devops_indicators) / len(cloud_devops_indicators), 3)
        skills['data_engineering'] = round(len(combined & data_engineering_indicators) / len(data_engineering_indicators), 3)
        skills['cybersecurity'] = round(len(combined & cybersecurity_indicators) / len(cybersecurity_indicators), 3)
        
        return skills
    
    def quality(self):
        coverage_values = [repo['test_coverage'] for repo in self.data['repositories']]
        if not coverage_values:
            return {'avg_test_coverage': 0.0,
                'quality_score': 0.0,
                'rating': 'unknown'}
        
        avg_coverage = statistics.mean(coverage_values)
        max_coverage = max(coverage_values)
        quality_score = min (avg_coverage / 100, 1.0)

        if avg_coverage > 70:
            rating = 'excellent'
        elif avg_coverage > 40:
            rating = 'good'
        elif avg_coverage > 20:
            rating = 'fair'
        else:
            rating = 'needs improvement'
        
        return {'avg_test_coverage': round(avg_coverage, 2),
            'quality_score': round(quality_score, 3),
            'rating': rating}
    
    def translate(self):
        self.load_filtereddata()
        
        profile = {
            'languages': self.language_aggregation(),
            'libraries': self.library_aggregation(),
            'frameworks': self.framework_aggregation(),
            'technical_depth': self.analytical_depth(),
            'composition': self.composition(),
            'skills': self.skills(),
            'quality': self.quality(),
            'metadata': {
                'total_repositories': len(self.data['repositories']),
                'total_commits': self.data['total_commits'],
                'analysis_timestamp': datetime.now().isoformat()
            }
        }
        
        return profile

    def save_to_json(self, output_file='translated.json'):
        #Saving translated profile to JSON file
        profile = self.translate()
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(profile, f, indent=2)
        
        print(f"Developer Profile Analysis Complete")
        print(f"Languages: {len(profile['languages'])}")
        print(f"Primary Skills: {list(profile['skills'].keys())}")
        print(f"Composition - Frontend: {profile['composition']['frontend']}, "
              f"Backend: {profile['composition']['backend']}, "
              f"Data: {profile['composition']['data']}")
        print(f"Saved to {output_file}")

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python translated.py <filtered.json> [output_dir]")
        sys.exit(1)
    
    # filtered_file = sys.argv[1]
    
    # received as str now, so convert back to path
    filtered_file = Path(sys.argv[1])

    # If second argument is provided, it's the output directory
    if len(sys.argv) > 2:
        output_dir = Path(sys.argv[2])
        output_file = output_dir / 'translated.json'
    else:
        output_file = 'translated.json'
    
    translator = DeveloperProfile1(filtered_file)
    translator.save_to_json(str(output_file))    
        
                    
        