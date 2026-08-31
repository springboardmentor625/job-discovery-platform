from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, Any
from datetime import datetime



# -------------------------
# User Schemas
# -------------------------

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str
    phone: Optional[str] = None
    profile_picture: Optional[str] = None


class UserResponse(BaseModel):
    user_id: int
    full_name: str
    email: EmailStr
    role: str
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    is_verified: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# -------------------------
# Company Schemas
# -------------------------

class CompanyCreate(BaseModel):
    company_name: str
    company_type: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    headquarters: Optional[str] = None


class CompanyResponse(BaseModel):
    company_id: int
    company_name: str
    company_type: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    headquarters: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Job Schemas
# -------------------------

class JobCreate(BaseModel):
    company_id: int
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    experience_required: Optional[str] = None
    required_skills: Optional[Any] = None
    status: Optional[str] = None


class JobResponse(BaseModel):
    job_id: int
    company_id: int
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    experience_required: Optional[str] = None
    required_skills: Optional[Any] = None
    posted_date: datetime
    status: Optional[str] = None
    applicant_count: Optional[int] = 0
    competition_level: Optional[str] = "Low"
    is_early_applicant: Optional[bool] = True

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Resume Schemas
# -------------------------

class ResumeCreate(BaseModel):
    
    resume_name: str
    file_path: str
    extracted_skills: Optional[Any] = None
    is_default: bool = False

class ResumeUpdate(BaseModel):
    user_id: Optional[int] = None
    resume_name: Optional[str] = None
    file_path: Optional[str] = None
    extracted_skills: Optional[Any] = None
    is_default: Optional[bool] = None

class ResumeResponse(BaseModel):
    resume_id: int
    user_id: int
    resume_name: str
    file_path: str
    extracted_skills: Optional[Any] = None
    uploaded_at: datetime
    is_default: bool
    ats_score: int = 0

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Candidate Profile Schemas
# -------------------------

class CandidateProfileCreate(BaseModel):
    user_id: int
    headline: Optional[str] = None
    summary: Optional[str] = None
    location: Optional[str] = None
    preferred_job_type: Optional[str] = None
    preferred_location: Optional[str] = None
    experience_years: Optional[int] = None
    education: Optional[Any] = None
    projects: Optional[Any] = None
    certifications: Optional[Any] = None


class CandidateProfileResponse(BaseModel):
    profile_id: int
    user_id: int
    headline: Optional[str] = None
    summary: Optional[str] = None
    location: Optional[str] = None
    preferred_job_type: Optional[str] = None
    preferred_location: Optional[str] = None
    experience_years: Optional[int] = None
    education: Optional[Any] = None
    projects: Optional[Any] = None
    certifications: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)

class JobUpdate(BaseModel):
    company_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    experience_required: Optional[str] = None
    required_skills: Optional[Any] = None
    status: Optional[str] = None


class ApplicationCreate(BaseModel):
    
    job_id: int
    resume_id: int
    status: Optional[str] = "Applied"


class ApplicationResponse(BaseModel):
    application_id: int
    user_id: int
    job_id: int
    resume_id: int
    status: Optional[str]
    applied_at: datetime

    class Config:
        from_attributes = True    

class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class ApplicationCreate(BaseModel):
    job_id: int
    resume_id: int


class ApplicationResponse(BaseModel):
    application_id: int
    user_id: int
    job_id: int
    resume_id: int
    status: Optional[str] = None
    applied_at: datetime

    class Config:
        from_attributes = True    


# -------------------------
# Notification Schemas
# -------------------------

class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    notification_type: Optional[str] = None
    related_job_id: Optional[int] = None
    related_application_id: Optional[int] = None


class NotificationUpdate(BaseModel):
    is_read: bool


class NotificationResponse(BaseModel):
    notification_id: int
    user_id: int
    title: str
    message: str
    notification_type: Optional[str] = None
    related_job_id: Optional[int] = None
    related_application_id: Optional[int] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Recommendation Schemas
# -------------------------

class RecommendationCreate(BaseModel):
    user_id: int
    job_id: int
    recommendation_score: str
    recommendation_reason: str
    matching_skills: Optional[Any] = None
    missing_skills: Optional[Any] = None


class RecommendationResponse(BaseModel):
    recommendation_id: int
    user_id: int
    job_id: int
    recommendation_score: str
    recommendation_reason: str
    matching_skills: Optional[Any] = None
    missing_skills: Optional[Any] = None
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# ATS Report Schemas
# -------------------------

class ATSReportCreate(BaseModel):
    resume_id: int
    job_id: int
    ats_score: str
    match_percentage: str
    missing_skills: Optional[Any] = None
    missing_keywords: Optional[Any] = None
    suggestions: Optional[str] = None


class ATSReportResponse(BaseModel):
    ats_report_id: int
    resume_id: int
    job_id: int
    ats_score: str
    match_percentage: str
    missing_skills: Optional[Any] = None
    missing_keywords: Optional[Any] = None
    suggestions: Optional[str] = None
    analyzed_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Candidate Profile Completion Schemas
# -------------------------

class ProfileCompletionResponse(BaseModel):
    percentage: int
    completed_fields: list[str]
    missing_fields: list[str]
    total_fields: int
    has_resume: bool
    has_profile: bool


# -------------------------
# Analytics Dashboard Schemas
# -------------------------

class AnalyticsDashboardResponse(BaseModel):
    total_applications: int
    applied_count: int
    shortlisted_count: int
    selected_count: int
    rejected_count: int
    interested_count: int
    passed_count: int
    total_swipes: int
    response_rate: float
    interview_rate: float
    avg_ats_score: float
    resumes_count: int
    recommendations_count: int
    avg_recommendation_score: float
    skill_gaps: list[dict]
    status_distribution: list[dict]
    application_trends: list[dict]
