from sqlalchemy import Column, Integer, String, Boolean, Text, TIMESTAMP, ForeignKey, JSON, DateTime
from sqlalchemy.sql import func
from .database import Base
from datetime import datetime, timezone

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
    ats_score = Column(Integer, default=0)

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

class Application(Base):
    __tablename__ = "applications"

    application_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.job_id"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.resume_id"), nullable=False)

    status = Column(String(50))
    applied_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )    

class SwipeHistory(Base):
    __tablename__ = "swipe_history"

    swipe_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False
    )

    job_id = Column(
        Integer,
        ForeignKey("jobs.job_id"),
        nullable=False
    )

    swipe_action = Column(
        String(20),
        nullable=False
    )

    swiped_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50))  # "recommendation", "application", "alert", etc.
    related_job_id = Column(Integer, ForeignKey("jobs.job_id"), nullable=True)
    related_application_id = Column(Integer, ForeignKey("applications.application_id"), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Recommendation(Base):
    __tablename__ = "recommendations"

    recommendation_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.job_id"), nullable=False)
    recommendation_score = Column(String(255), nullable=False)  # Float stored as string for precision
    recommendation_reason = Column(Text, nullable=False)
    matching_skills = Column(JSON)  # Array of matched skills
    missing_skills = Column(JSON)  # Array of missing skills
    generated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ATSReport(Base):
    __tablename__ = "ats_reports"

    ats_report_id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.resume_id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.job_id"), nullable=False)
    ats_score = Column(String(255), nullable=False)  # Float stored as string for precision
    match_percentage = Column(String(255), nullable=False)
    missing_skills = Column(JSON)  # Array of skills in job but not in resume
    missing_keywords = Column(JSON)  # Array of keywords in job description not in resume
    suggestions = Column(Text)  # Improvement suggestions
    analyzed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))