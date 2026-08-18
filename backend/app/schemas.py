from __future__ import annotations
import re
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, field_validator
class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=12)
    confirm_password: str = Field(..., min_length=12)
    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: Optional[str]):
        if value and not re.match(r"^\+?[0-9\s\-]+$", value):
            raise ValueError("Phone number must contain only digits, spaces, hyphens, and an optional leading '+'")
        return value
    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str):
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain at least one uppercase letter (A-Z)")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must contain at least one lowercase letter (a-z)")
        if not re.search(r"[0-9]", value):
            raise ValueError("Password must contain at least one digit (0-9)")
        if not re.search(r"[!@#$%^&*]", value):
            raise ValueError("Password must contain at least one special character (!@#$%^&*)")
        return value
class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)
    @field_validator("confirm_password")
    @classmethod
    def validate_confirm_password(cls, value: str, info):
        data = info.data
        password = data.get("password")
        if value != password:
            raise ValueError("Passwords do not match")
        return value
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
class UpdateProfileRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    headline: Optional[str] = None
    summary: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    experience_years: Optional[int] = None
    branch: Optional[str] = None
    stream: Optional[str] = None
    projects: Optional[str] = None
    certifications: Optional[str] = None
    skills: Optional[str] = None
    preferred_job_type: Optional[str] = None
    preferred_city: Optional[str] = None
    preferred_state: Optional[str] = None
class CandidateProfileOut(BaseModel):
    profile_id: int
    user_id: int
    headline: Optional[str] = None
    summary: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    experience_years: Optional[int] = None
    branch: Optional[str] = None
    stream: Optional[str] = None
    projects: Optional[str] = None
    certifications: Optional[str] = None
    skills: Optional[str] = None
    preferred_job_type: Optional[str] = None
    preferred_city: Optional[str] = None
    preferred_state: Optional[str] = None
class UserOut(BaseModel):
    user_id: int
    full_name: str
    email: str
    role: str
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    is_verified: bool
    created_at: str
class CandidateMeResponse(BaseModel):
    user: UserOut
    profile: CandidateProfileOut | None = None
    has_resume: bool = False
class CompanyOut(BaseModel):
    company_id: int
    company_name: str
    company_type: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    headquarters: Optional[str] = None
    career_page: Optional[str] = None
    class Config:
        from_attributes = True
class JobOut(BaseModel):
    job_id: int
    company_id: int
    title: str
    description: str
    location: Optional[str] = None
    employment_type: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    experience_required: Optional[int] = None
    required_skills: Optional[Dict[str, Any]] = None
    status: str
    apply_url: Optional[str] = None
    company: CompanyOut
    class Config:
        from_attributes = True
class SavedJobOut(BaseModel):
    swipe_id: int
    job: JobOut
    saved_at: Optional[str] = None
    class Config:
        from_attributes = True
class SwipeActionResponse(BaseModel):
    message: str
    apply_url: Optional[str] = None
class SwipeActionRequest(BaseModel):
    job_id: int
    action: str = Field(..., description="LEFT, RIGHT, or SAVE")
class ATSReportOut(BaseModel):
    ats_report_id: int
    job_id: Optional[int] = None
    ats_score: Optional[float] = None
    match_percentage: Optional[float] = None
    missing_skills: Optional[Dict[str, Any]] = None
    missing_keywords: Optional[Dict[str, Any]] = None
    suggestions: Optional[str] = None
    class Config:
        from_attributes = True
class ResumeOut(BaseModel):
    resume_id: int
    resume_name: str
    extracted_skills: Optional[Dict[str, Any]] = None
    is_default: bool
    class Config:
        from_attributes = True