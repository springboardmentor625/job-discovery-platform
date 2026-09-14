import pytest
from unittest.mock import MagicMock
from app.ai_services.job_matching_service import _get_job_skills, analyze_skill_gap, get_match_explanation
from app.ai_services.recommendation_engine import _calc_match, get_job_recommendations
from app.models.job import Job, JobStatus
from app.models.profile import Profile
from app.models.resume import Resume
from app.models.swipe import Swipe, SwipeType

def test_calc_match():
    job = Job(required_skills=["Python", "FastAPI", "React"])
    user_skills = ["python", "react"]
    score, matched, missing = _calc_match(job, user_skills)
    
    assert "python" in matched
    assert "react" in matched
    assert "fastapi" in missing
    assert score == 66  # 2/3 * 100

def test_calc_match_no_skills():
    job = Job(required_skills=[])
    user_skills = ["python"]
    score, matched, missing = _calc_match(job, user_skills)
    
    assert score == 70
    assert len(matched) == 0

# A simple mock DB session
class MockSession:
    def __init__(self, data_map):
        self.data_map = data_map

    def query(self, model):
        class MockQuery:
            def __init__(self, data):
                self.data = data
            def filter(self, *args, **kwargs):
                return self
            def first(self):
                return self.data[0] if self.data else None
            def all(self):
                return self.data
                
        if model == Job:
            return MockQuery(self.data_map.get('jobs', []))
        if model == Profile:
            return MockQuery(self.data_map.get('profiles', []))
        if model == Resume:
            return MockQuery(self.data_map.get('resumes', []))
        if model == Swipe:
            return MockQuery(self.data_map.get('swipes', []))
            
        return MockQuery([])

def test_skill_gap_analyzer():
    job = Job(job_id="1", required_skills=["Docker", "AWS", "Kubernetes"])
    profile = Profile(user_id="u1", skills=["Docker"])
    
    db = MockSession({'jobs': [job], 'profiles': [profile]})
    
    res = analyze_skill_gap(db, "u1", "1")
    assert res.skill_match_percentage == 33
    assert "Docker" in res.matched_skills
    
    missing = [m.skill for m in res.missing_skills]
    assert "Aws" in missing
    assert "Kubernetes" in missing
    
    # Priority check (first 2 missing are high)
    assert res.missing_skills[0].priority == "high"

def test_adaptive_recommendation_engine():
    # User likes python jobs, skips java jobs
    j1 = Job(job_id="1", required_skills=["Python"], location="NY", status=JobStatus.active)
    j2 = Job(job_id="2", required_skills=["Java"], location="SF", status=JobStatus.active)
    j3 = Job(job_id="3", required_skills=["Python"], location="SF", status=JobStatus.active) # target
    
    swipe_right = Swipe(user_id="u1", job_id="1", job=j1, swipe_type=SwipeType.right)
    swipe_left = Swipe(user_id="u1", job_id="2", job=j2, swipe_type=SwipeType.left)
    
    db = MockSession({
        'swipes': [swipe_right, swipe_left],
        'jobs': [j3], # available jobs
        'profiles': []
    })
    
    recs = get_job_recommendations(db, "u1")
    assert len(recs) == 1
    
    # Python job should get a boost from positive swipe preference
    assert recs[0].recommendation_score > 40
    assert "Similar to jobs you liked or applied to" in recs[0].reasons
