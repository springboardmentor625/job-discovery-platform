from pydantic import BaseModel
from typing import List

class MatchBreakdown(BaseModel):
    skills_match: int
    experience_match: int
    location_match: int
    preference_match: int
    resume_keyword_match: int

class MatchExplanationResponse(BaseModel):
    job_id: str
    overall_match_score: int
    breakdown: MatchBreakdown
    matched_skills: List[str]
    missing_skills: List[str]
    strengths: List[str]
    improvement_areas: List[str]
    explanation: str

class SkillPriority(BaseModel):
    skill: str
    priority: str # 'high', 'medium', 'low'

class SkillGapResponse(BaseModel):
    job_id: str
    skill_match_percentage: int
    matched_skills: List[str]
    missing_skills: List[SkillPriority]
    recommendation: str
