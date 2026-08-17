from sqlalchemy import Column, Integer, String, Boolean, Text, TIMESTAMP, ForeignKey, JSON
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role = Column(String(20), nullable=False)
    phone = Column(String(15))
    profile_picture = Column(Text)
    is_verified = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

class Resume(Base):
    __tablename__ = "resumes"

    resume_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    resume_name = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    extracted_skills = Column(JSON)
    uploaded_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    is_default = Column(Boolean, default=False)

class CandidateProfile(Base):
    __tablename__ = "candidate_profile"

    profile_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    headline = Column(String(255))
    summary = Column(Text)
    location = Column(String(255))
    preferred_job_type = Column(String(100))
    preferred_location = Column(String(255))

    experience_years = Column(Integer)

    education = Column(JSON)
    projects = Column(JSON)
    certifications = Column(JSON) 


class Company(Base):
    __tablename__ = "companies"

    company_id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255), nullable=False)
    company_type = Column(String(100))
    industry = Column(String(100))
    website = Column(String(255))
    headquarters = Column(String(255))


class Job(Base):
    __tablename__ = "jobs"

    job_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    location = Column(String(255))
    employment_type = Column(String(50))
    salary_min = Column(Integer)
    salary_max = Column(Integer)
    experience_required = Column(String(100))
    required_skills = Column(JSON)
    posted_date = Column(TIMESTAMP, server_default=func.current_timestamp())
    status = Column(String(50))
       