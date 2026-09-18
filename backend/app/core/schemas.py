from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime

# ==========================================
# Base Config
# ==========================================
class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Authentication & Users
# ==========================================
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    role: str = Field(pattern="^(candidate|recruiter)$")
    full_name: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: uuid.UUID

# ==========================================
# Candidate Profiles (Microsoft Careers Style)
# ==========================================
class CandidateProfileUpdate(BaseModel):
    phone_number: Optional[str] = None
    location: Optional[str] = None
    about_bio: Optional[str] = None
    skills: Optional[List[str]] = None
    education: Optional[List[Dict[str, Any]]] = None
    experience: Optional[List[Dict[str, Any]]] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None

class CandidateProfileResponse(BaseSchema):
    id: uuid.UUID
    user_id: uuid.UUID
    full_name: str
    phone_number: Optional[str] = None
    location: Optional[str] = None
    about_bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    skills: List[str] = []
    education: List[Dict[str, Any]] = []
    experience: List[Dict[str, Any]] = []
    profile_health_score: int = 0
    profile_completion: Optional[int] = None
    has_resume: bool = False
    resume_file_url: Optional[str] = None

# ==========================================
# Jobs & Swipes
# ==========================================
class JobCreate(BaseModel):
    title: str
    company_name: str
    description: str
    required_skills: List[str] = []
    location: Optional[str] = None

class JobResponse(BaseSchema):
    id: uuid.UUID
    title: str
    company_name: str
    description: str
    required_skills: List[str] = []
    location: Optional[str] = None
    is_active: bool = True
    match_score: Optional[float] = None
    top_resume_match: Optional[str] = None

class SwipeAction(BaseModel):
    job_id: uuid.UUID
    direction: str = Field(pattern="^(right|left)$")

class ATSReportResponse(BaseModel):
    status: str
    ats_score: float
    missing_skills: List[str]
    improvement_suggestions: List[str]