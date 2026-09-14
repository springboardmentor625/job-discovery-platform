from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.job import JobStatus

class JobBase(BaseModel):
    job_title: str
    job_description: str
    required_skills: List[str] = []
    experience_required: Optional[int] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None

class JobCreate(JobBase):
    pass

class JobUpdate(JobBase):
    job_title: Optional[str] = None
    job_description: Optional[str] = None
    status: Optional[JobStatus] = None

class JobInDBBase(JobBase):
    job_id: str
    recruiter_id: str
    company_id: str
    posted_date: datetime
    closing_date: Optional[datetime] = None
    status: JobStatus
    views_count: int
    applicant_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # We will add company details here to avoid N+1 queries from frontend
    company_name: Optional[str] = None
    company_logo: Optional[str] = None

    class Config:
        from_attributes = True

class Job(JobInDBBase):
    pass

class JobRecommendation(BaseModel):
    job: Job
    match_percentage: int
    matched_skills: list[str]
    missing_skills: list[str]
    recommendation_score: int
    reasons: list[str]
    recommendation_reason: str # kept for backward compatibility if needed
