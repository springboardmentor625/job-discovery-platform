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

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Resume Schemas
# -------------------------

class ResumeCreate(BaseModel):
    user_id: int
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