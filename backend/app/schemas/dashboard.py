from pydantic import BaseModel
from typing import List

class StatCard(BaseModel):
    label: str
    value: int
    icon: str
    color: str
    bg: str

class ActivityItem(BaseModel):
    type: str # 'application', 'saved_job', etc.
    company: str
    role: str
    status: str
    date: str

class JobSeekerDashboardStats(BaseModel):
    stats: List[StatCard]
    recent_activity: List[ActivityItem]
    profile_completion_percentage: int
    new_matches_count: int

class RecruiterActivityItem(BaseModel):
    type: str # 'application'
    applicant_name: str
    role: str
    status: str
    date: str

class RecruiterDashboardStats(BaseModel):
    stats: List[StatCard]
    recent_activity: List[RecruiterActivityItem]
    has_company: bool

