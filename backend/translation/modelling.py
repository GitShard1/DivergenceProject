import json
import math
from typing import Dict, List, Tuple
from dataclasses import dataclass, asdict

@dataclass
class SkillVector:
    """Normalized skill scores across domains"""
    backend: float
    frontend: float
    data: float
    ai_ml: float
    cloud_infrastructure: float
    architecture: float
    
@dataclass
class CodeStyleProfile:
    """Code style and approach inferred from language choices"""
    type_safety_preference: float  # TypeScript, typed Python usage
    functional_vs_oop: float  # 0=functional, 1=OOP
    language_diversity: float  # Number of languages normalized
    complexity_tolerance: float  # Based on repo size and depth
    
@dataclass
class FrictionProfile:
    """Friction scores for various technologies/patterns"""
    react_friction: float
    vue_friction: float
    typescript_friction: float
    python_typing_friction: float
    ml_project_friction: float
    devops_friction: float
    microservices_friction: float
    fullstack_friction: float
    mobile_friction: float
    
@dataclass
class CapabilityAssessment:
    """Success likelihood for different project types"""
    api_service: float
    cli_tool: float
    data_pipeline: float
    ml_model: float
    frontend_app: float
    fullstack_app: float
    infrastructure: float
    plugin_system: float

class DivergencePredictiveModel:
    def __init__(self, translated_file: str):
        self.translated_file = translated_file
        self.data = None
        
    def load_data(self):
        """Load translated profile data"""
        with open(self.translated_file, 'r', encoding='utf-8') as f:
            self.data = json.load(f)
    
    def _detect_library_category(self, lib_name: str) -> str:
        """Categorize a library by its purpose"""
        lib = lib_name.lower()
        
        # AI/ML libraries
        if lib in ['openai', 'anthropic', 'transformers', 'pytorch', 'tensorflow', 
                   'sklearn', 'keras', 'langchain']:
            return 'ai_ml'
        
        # Data processing
        if lib in ['pandas', 'numpy', 'scipy', 'polars', 'dask']:
            return 'data_processing'
        
        # Web frameworks
        if lib in ['flask', 'django', 'fastapi', 'express', 'react', 'vue', 'angular']:
            return 'web_framework'
        
        # DevOps/Infrastructure
        if lib in ['docker', 'kubernetes', 'terraform', 'ansible']:
            return 'devops'
        
        # Testing
        if lib in ['pytest', 'unittest', 'jest', 'mocha', 'cypress']:
            return 'testing'
        
        # CLI/Tooling - KEY INDICATORS FOR DEVTOOLS SKILL
        if lib in ['argparse', 'click', 'typer', 'rich', 'colorama', 'prompt-toolkit']:
            return 'cli_tool'
        
        # Async/Concurrency
        if lib in ['asyncio', 'aiohttp', 'celery', 'threading']:
            return 'async'
        
        # Data structures (advanced Python usage)
        if lib in ['collections', 'itertools', 'functools', 'heapq', 'deque', 
                   'counter', 'lru_cache', 'cache']:
            return 'advanced_python'
        
        return 'other'
    
    def _infer_devtools_skill(self) -> float:
        """
        Infer developer tooling skill from:
        1. CLI library usage (argparse, click, etc.)
        2. Test coverage (pytest usage)
        3. Advanced Python patterns (decorators, data structures)
        4. Language diversity (polyglot developers build more tools)
        """
        libs = self.data.get('libraries', {})
        quality = self.data['quality']
        
        # Check for CLI tooling libraries
        cli_indicators = {'argparse', 'click', 'typer', 'rich', 'colorama'}
        has_cli_tools = sum(1 for lib in libs.keys() if lib.lower() in cli_indicators)
        cli_score = min(has_cli_tools / 2, 1.0)  # Normalize to 0-1
        
        # Check for advanced Python patterns (indicates tool-building)
        advanced_indicators = {'functools', 'itertools', 'collections', 'heapq', 
                              'lru_cache', 'cache', 'deque'}
        has_advanced = sum(1 for lib in libs.keys() if lib.lower() in advanced_indicators)
        advanced_score = min(has_advanced / 4, 1.0)
        
        # Testing sophistication (pytest is a devtool)
        testing_indicators = {'pytest', 'unittest', 'mock'}
        has_testing = sum(1 for lib in libs.keys() if lib.lower() in testing_indicators)
        testing_score = min(has_testing / 2, 1.0)
        
        # Quality discipline (good devtools have good tests)
        quality_score = quality['quality_score']
        
        # Combine signals
        devtools_skill = (
            cli_score * 0.35 +
            advanced_score * 0.25 +
            testing_score * 0.25 +
            quality_score * 0.15
        )
        
        return round(devtools_skill, 3)
    
    def compute_skill_vector(self) -> SkillVector:
        """
        Synthesize normalized skill scores from available data
        No time-series or commit patterns - only static analysis
        """
        comp = self.data['composition']
        langs = self.data['languages']
        skills = self.data['skills']
        quality = self.data['quality']
        depth = self.data['technical_depth']
        libs = self.data.get('libraries', {})
        
        # Backend skill (Python + backend composition + quality)
        python_strength = langs.get('Python', 0) / 100
        backend = (
            comp['backend'] * 0.5 +
            python_strength * 0.3 +
            quality['quality_score'] * 0.2
        )
        
        # Frontend skill (JS/TS + HTML/CSS)
        frontend_langs = (
            langs.get('JavaScript', 0) +
            langs.get('TypeScript', 0) +
            langs.get('HTML', 0) +
            langs.get('CSS', 0)
        ) / 100
        frontend = comp['frontend'] * 0.7 + frontend_langs * 0.3
        
        # Data skill (data composition + data engineering)
        data = (
            comp['data'] * 0.5 +
            skills.get('data_engineering', 0) * 0.5
        )
        
        # AI/ML skill (from skills + OpenAI/Anthropic library usage)
        has_ai_libs = any(lib.lower() in ['openai', 'anthropic', 'langchain'] 
                         for lib in libs.keys())
        ai_ml = skills.get('ai_ml', 0) + (0.2 if has_ai_libs else 0)
        
        # Cloud/Infrastructure
        cloud = skills.get('cloud_devops', 0)
        
        # Architecture skill (inferred from depth + size + quality)
        # Large, well-tested projects indicate architectural experience
        architecture = (
            depth['depth_score'] * 0.5 +
            quality['quality_score'] * 0.3 +
            min(depth['avg_repo_size'] / 2000, 1.0) * 0.2
        )
        
        return SkillVector(
            backend=round(min(backend, 1.0), 3),
            frontend=round(min(frontend, 1.0), 3),
            data=round(min(data, 1.0), 3),
            ai_ml=round(min(ai_ml, 1.0), 3),
            cloud_infrastructure=round(cloud, 3),
            architecture=round(min(architecture, 1.0), 3)
        )
    
    def compute_code_style_profile(self) -> CodeStyleProfile:
        """
        Analyze coding style preferences from language usage
        """
        langs = self.data['languages']
        depth = self.data['technical_depth']
        libs = self.data.get('libraries', {})
        
        # Type safety preference (TypeScript + typed Python indicators)
        ts_usage = langs.get('TypeScript', 0)
        has_typing = any(lib.lower() in ['typing', 'mypy', 'pydantic'] 
                        for lib in libs.keys())
        type_safety = (ts_usage / 50 + (0.3 if has_typing else 0))
        
        # Functional vs OOP (based on library patterns)
        functional_libs = {'functools', 'itertools', 'map', 'filter', 'reduce'}
        oop_libs = {'class', 'inheritance', 'polymorphism'}
        func_count = sum(1 for lib in libs.keys() if lib.lower() in functional_libs)
        functional_vs_oop = 0.3 if func_count > 2 else 0.7  # 0=functional, 1=OOP
        
        # Language diversity (polyglot tendency)
        lang_count = len([v for v in langs.values() if v > 1])
        language_diversity = min(lang_count / 6, 1.0)
        
        # Complexity tolerance (large repos = comfortable with complexity)
        complexity_tolerance = depth['depth_score']
        
        return CodeStyleProfile(
            type_safety_preference=round(min(type_safety, 1.0), 3),
            functional_vs_oop=round(functional_vs_oop, 3),
            language_diversity=round(language_diversity, 3),
            complexity_tolerance=round(complexity_tolerance, 3)
        )
    
    def compute_friction_profile(self, skill_vector: SkillVector, 
                                 code_style: CodeStyleProfile) -> FrictionProfile:
        """
        Calculate friction without behavioral/temporal data
        Based purely on current skill levels and style preferences
        """
        langs = self.data['languages']
        
        # Type safety experience (for typed frameworks)
        type_experience = code_style.type_safety_preference
        
        # React friction (needs frontend + type safety + complexity)
        react_friction = 1 - (
            skill_vector.frontend * 0.4 +
            type_experience * 0.3 +
            code_style.complexity_tolerance * 0.3
        )
        
        # Vue friction (simpler, less typing needed)
        vue_friction = 1 - (
            skill_vector.frontend * 0.6 +
            code_style.language_diversity * 0.4
        )
        
        # TypeScript friction
        typescript_friction = 1 - (
            type_experience * 0.5 +
            skill_vector.frontend * 0.3 +
            code_style.complexity_tolerance * 0.2
        )
        
        # Python typing friction (mypy, type hints)
        python_typing_friction = 1 - (
            type_experience * 0.6 +
            skill_vector.backend * 0.4
        )
        
        # ML project friction
        ml_project_friction = 1 - (
            skill_vector.ai_ml * 0.4 +
            skill_vector.data * 0.3 +
            skill_vector.backend * 0.2 +
            self.data['quality']['quality_score'] * 0.1
        )
        
        # DevOps friction
        devops_friction = 1 - (
            skill_vector.cloud_infrastructure * 0.6 +
            skill_vector.backend * 0.4
        )
        
        # Microservices friction (needs architecture + backend + cloud)
        microservices_friction = 1 - (
            skill_vector.architecture * 0.4 +
            skill_vector.backend * 0.3 +
            skill_vector.cloud_infrastructure * 0.3
        )
        
        # Fullstack friction
        fullstack_friction = 1 - (
            skill_vector.frontend * 0.4 +
            skill_vector.backend * 0.4 +
            skill_vector.architecture * 0.2
        )
        
        # Mobile friction (needs frontend fundamentals)
        mobile_friction = 1 - (
            skill_vector.frontend * 0.5 +
            code_style.language_diversity * 0.3 +
            skill_vector.architecture * 0.2
        )
        
        return FrictionProfile(
            react_friction=round(max(react_friction, 0), 3),
            vue_friction=round(max(vue_friction, 0), 3),
            typescript_friction=round(max(typescript_friction, 0), 3),
            python_typing_friction=round(max(python_typing_friction, 0), 3),
            ml_project_friction=round(max(ml_project_friction, 0), 3),
            devops_friction=round(max(devops_friction, 0), 3),
            microservices_friction=round(max(microservices_friction, 0), 3),
            fullstack_friction=round(max(fullstack_friction, 0), 3),
            mobile_friction=round(max(mobile_friction, 0), 3)
        )
    
    def compute_capability_assessment(self, skill_vector: SkillVector,
                                      code_style: CodeStyleProfile) -> CapabilityAssessment:
        """
        Predict success likelihood for project types
        Based on skill match, no temporal factors
        """
        quality = self.data['quality']['quality_score']
        
        # API service (backend + architecture + quality)
        api_service = (
            skill_vector.backend * 0.5 +
            skill_vector.architecture * 0.3 +
            quality * 0.2
        )
        
        # CLI tool (backend + code quality)
        devtools_skill = self._infer_devtools_skill()
        cli_tool = (
            skill_vector.backend * 0.4 +
            devtools_skill * 0.4 +
            quality * 0.2
        )
        
        # Data pipeline (data + backend + architecture)
        data_pipeline = (
            skill_vector.data * 0.4 +
            skill_vector.backend * 0.4 +
            skill_vector.architecture * 0.2
        )
        
        # ML model (AI/ML + data + quality)
        ml_model = (
            skill_vector.ai_ml * 0.5 +
            skill_vector.data * 0.3 +
            quality * 0.2
        )
        
        # Frontend app (frontend + quality)
        frontend_app = (
            skill_vector.frontend * 0.7 +
            quality * 0.3
        )
        
        # Fullstack app (both + architecture)
        fullstack_app = (
            skill_vector.frontend * 0.3 +
            skill_vector.backend * 0.4 +
            skill_vector.architecture * 0.3
        )
        
        # Infrastructure (cloud + backend + architecture)
        infrastructure = (
            skill_vector.cloud_infrastructure * 0.5 +
            skill_vector.backend * 0.3 +
            skill_vector.architecture * 0.2
        )
        
        # Plugin system (backend + architecture + devtools)
        plugin_system = (
            skill_vector.backend * 0.4 +
            skill_vector.architecture * 0.3 +
            devtools_skill * 0.3
        )
        
        return CapabilityAssessment(
            api_service=round(min(api_service, 1.0), 3),
            cli_tool=round(min(cli_tool, 1.0), 3),
            data_pipeline=round(min(data_pipeline, 1.0), 3),
            ml_model=round(min(ml_model, 1.0), 3),
            frontend_app=round(min(frontend_app, 1.0), 3),
            fullstack_app=round(min(fullstack_app, 1.0), 3),
            infrastructure=round(min(infrastructure, 1.0), 3),
            plugin_system=round(min(plugin_system, 1.0), 3)
        )
    
    def identify_skill_gaps(self, skill_vector: SkillVector) -> Dict[str, float]:
        """Identify low-scoring areas (potential growth zones)"""
        skills_dict = asdict(skill_vector)
        gaps = {k: round(1.0 - v, 3) for k, v in skills_dict.items() if v < 0.5}
        return dict(sorted(gaps.items(), key=lambda x: x[1], reverse=True))
    
    def recommend_learning_path(self, skill_vector: SkillVector,
                                friction: FrictionProfile) -> List[Dict[str, any]]:
        """Suggest technologies based on current profile and friction"""
        recommendations = []
        
        # Strong backend, weak frontend → fullstack opportunity
        if skill_vector.backend > 0.6 and skill_vector.frontend < 0.3:
            recommendations.append({
                'area': 'Frontend Development',
                'priority': 'high',
                'friction': friction.react_friction,
                'rationale': 'Strong backend provides foundation for fullstack capability',
                'suggested_tech': ['React' if friction.react_friction < 0.6 else 'Vue', 
                                  'TypeScript', 'Tailwind CSS'],
                'estimated_friction': friction.react_friction
            })
        
        # Low AI/ML but strong data → ML opportunity
        if skill_vector.data > 0.4 and skill_vector.ai_ml < 0.3:
            recommendations.append({
                'area': 'AI/ML Engineering',
                'priority': 'medium',
                'friction': friction.ml_project_friction,
                'rationale': 'Data skills provide foundation for ML work',
                'suggested_tech': ['OpenAI API', 'LangChain', 'Vector DBs'],
                'estimated_friction': friction.ml_project_friction
            })
        
        # Low cloud but strong backend → infrastructure opportunity
        if skill_vector.backend > 0.6 and skill_vector.cloud_infrastructure < 0.2:
            recommendations.append({
                'area': 'Cloud Infrastructure',
                'priority': 'medium',
                'friction': friction.devops_friction,
                'rationale': 'Backend expertise needs cloud deployment skills',
                'suggested_tech': ['Docker', 'AWS/Vercel', 'CI/CD'],
                'estimated_friction': friction.devops_friction
            })
        
        return recommendations
    
    def predict_project_success(self, project_type: str,
                               capabilities: CapabilityAssessment,
                               friction: FrictionProfile) -> Dict[str, any]:
        """Predict project success and identify risks"""
        cap_dict = asdict(capabilities)
        friction_dict = asdict(friction)
        
        success_score = cap_dict.get(project_type, 0.5)
        
        # Map project types to relevant friction
        friction_map = {
            'frontend_app': 'react_friction',
            'fullstack_app': 'fullstack_friction',
            'ml_model': 'ml_project_friction',
            'infrastructure': 'devops_friction',
            'cli_tool': 'python_typing_friction'
        }
        
        relevant_friction = friction_dict.get(friction_map.get(project_type, ''), 0.5)
        
        # Determine risk
        if success_score > 0.7:
            risk = 'low'
        elif success_score > 0.4:
            risk = 'medium'
        else:
            risk = 'high'
        
        # Identify tensions
        tensions = []
        if success_score < 0.4:
            tensions.append(f'Low capability match ({success_score:.2f}) - significant skill gap')
        if relevant_friction > 0.6:
            tensions.append(f'High friction ({relevant_friction:.2f}) - steep learning curve')
        if self.data['quality']['quality_score'] < 0.5:
            tensions.append('Low test coverage may impact production quality')
        
        return {
            'project_type': project_type,
            'success_likelihood': round(success_score, 3),
            'friction_score': round(relevant_friction, 3),
            'risk_level': risk,
            'tension_points': tensions,
            'skill_gaps': self._identify_project_gaps(project_type, asdict(self.compute_skill_vector()))
        }
    
    def _identify_project_gaps(self, project_type: str, skills: Dict) -> List[str]:
        """Identify specific skill gaps for a project type"""
        gaps = []
        
        gap_map = {
            'frontend_app': [('frontend', 0.5), ('architecture', 0.4)],
            'fullstack_app': [('frontend', 0.5), ('backend', 0.6), ('architecture', 0.5)],
            'ml_model': [('ai_ml', 0.4), ('data', 0.4)],
            'infrastructure': [('cloud_infrastructure', 0.4), ('backend', 0.5)],
        }
        
        for skill, threshold in gap_map.get(project_type, []):
            if skills.get(skill, 0) < threshold:
                gaps.append(f'{skill}: {skills.get(skill, 0):.2f} (needs ≥{threshold})')
        
        return gaps
    
    def generate_predictive_profile(self) -> Dict:
        """Generate complete predictive profile"""
        self.load_data()
        
        skill_vector = self.compute_skill_vector()
        code_style = self.compute_code_style_profile()
        friction = self.compute_friction_profile(skill_vector, code_style)
        capabilities = self.compute_capability_assessment(skill_vector, code_style)
        skill_gaps = self.identify_skill_gaps(skill_vector)
        learning_path = self.recommend_learning_path(skill_vector, friction)
        devtools_skill = self._infer_devtools_skill()
        
        return {
            'skill_vector': asdict(skill_vector),
            'code_style_profile': asdict(code_style),
            'friction_profile': asdict(friction),
            'capability_assessment': asdict(capabilities),
            'skill_gaps': skill_gaps,
            'learning_recommendations': learning_path,
            'devtools_skill': devtools_skill,
            'metadata': {
                'model_version': '2.0.0',
                'based_on_repos': self.data['metadata']['total_repositories'],
                'data_source': 'static_analysis_only',
                'analysis_timestamp': self.data['metadata']['analysis_timestamp']
            }
        }
    
    def save_predictions(self, output_file: str = 'predictive.json'):
        """Save predictive profile with visual summary"""
        profile = self.generate_predictive_profile()
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(profile, f, indent=2)
        
        print(f"\n{'='*70}")
        print("DIVERGENCE PREDICTIVE PROFILE")
        print(f"{'='*70}\n")
        
        print("SKILL VECTOR:")
        for skill, score in profile['skill_vector'].items():
            bar = '█' * int(score * 20)
            print(f"  {skill:.<30} {score:.3f} {bar}")
        
        print(f"\n  {'devtools (inferred)':.<30} {profile['devtools_skill']:.3f} {'█' * int(profile['devtools_skill'] * 20)}")
        
        print("\nCODE STYLE PROFILE:")
        for trait, score in profile['code_style_profile'].items():
            bar = '█' * int(score * 20)
            print(f"  {trait:.<30} {score:.3f} {bar}")
        
        print("\nFRICTION PROFILE (lower = easier):")
        for tech, friction in profile['friction_profile'].items():
            bar = '█' * int(friction * 20)
            color = '🟢' if friction < 0.3 else '🟡' if friction < 0.6 else '🔴'
            print(f"  {color} {tech:.<28} {friction:.3f} {bar}")
        
        print("\nCAPABILITY ASSESSMENT:")
        for proj, score in profile['capability_assessment'].items():
            bar = '█' * int(score * 20)
            color = '✓' if score > 0.7 else '~' if score > 0.4 else '✗'
            print(f"  {color} {proj:.<28} {score:.3f} {bar}")
        
        if profile['skill_gaps']:
            print("\nSKILL GAPS (growth opportunities):")
            for gap, severity in list(profile['skill_gaps'].items())[:3]:
                print(f"  ⚠️  {gap}: gap of {severity:.3f}")
        
        if profile['learning_recommendations']:
            print("\nRECOMMENDED LEARNING PATH:")
            for rec in profile['learning_recommendations'][:3]:
                print(f"  📚 {rec['area']}: friction {rec['friction']:.2f}")
                print(f"     → {', '.join(rec['suggested_tech'])}")
        
        print(f"\nSaved to {output_file}")

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python predictive.py <translated.json> [output_file]")
        sys.exit(1)
    
    translated_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'predictive.json'
    
    model = DivergencePredictiveModel(translated_file)
    model.save_predictions(output_file)