from __future__ import annotations
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, text, JSON, Float
from sqlalchemy.orm import relationship
from app.database import Base
class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="candidate")
    phone = Column(String(50), nullable=True)
    profile_picture = Column(String(255), nullable=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    candidate_profile = relationship(
        "CandidateProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
class CandidateProfile(Base):
    __tablename__ = "candidateprofile"
    profile_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, unique=True)
    headline = Column(String(255), nullable=True)
    summary = Column(String(2000), nullable=True)
    experience_years = Column(Integer, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    branch = Column(String(100), nullable=True)
    stream = Column(String(100), nullable=True)
    projects = Column(String(2000), nullable=True)
    certifications = Column(String(2000), nullable=True)
    skills = Column(String(500), nullable=True)
    preferred_job_type = Column(String(100), nullable=True)
    preferred_city = Column(String(100), nullable=True)
    preferred_state = Column(String(100), nullable=True)
    user = relationship("User", back_populates="candidate_profile")
class Company(Base):
    __tablename__ = "companies"
    company_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_name = Column(String(255), nullable=False)
    company_type = Column(String(100), nullable=True)
    industry = Column(String(100), nullable=True)
    website = Column(String(255), nullable=True)
    headquarters = Column(String(255), nullable=True)
    career_page = Column(String(500), nullable=True)
    jobs = relationship("Job", back_populates="company", cascade="all, delete-orphan")
class Job(Base):
    __tablename__ = "jobs"
    job_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(String, nullable=False)
    location = Column(String(255), nullable=True)
    employment_type = Column(String(100), nullable=True)
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    experience_required = Column(Integer, nullable=True)
    required_skills = Column(JSON, nullable=True)
    posted_date = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    status = Column(String(50), nullable=False, default="Active")
    apply_url = Column(String(500), nullable=True)
    company = relationship("Company", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
    swipes = relationship("SwipeHistory", back_populates="job", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="job", cascade="all, delete-orphan")
    ats_reports = relationship("ATSReport", back_populates="job", cascade="all, delete-orphan")
class Resume(Base):
    __tablename__ = "resumes"
    resume_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    resume_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    extracted_skills = Column(JSON, nullable=True)
    uploaded_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    is_default = Column(Boolean, default=False)
    user = relationship("User")
    applications = relationship("Application", back_populates="resume")
class Application(Base):
    __tablename__ = "applications"
    application_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.job_id"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.resume_id"), nullable=True)
    status = Column(String(50), nullable=False, default="Applied") 
    applied_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    user = relationship("User")
    job = relationship("Job", back_populates="applications")
    resume = relationship("Resume", back_populates="applications")
class SwipeHistory(Base):
    __tablename__ = "swipehistory"
    swipe_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.job_id"), nullable=False)
    swipe_action = Column(String(20), nullable=False) 
    swiped_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    user = relationship("User")
    job = relationship("Job", back_populates="swipes")
class Recommendation(Base):
    __tablename__ = "recommendations"
    recommendation_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.job_id"), nullable=False)
    recommendation_score = Column(Float, nullable=True)
    recommendation_reason = Column(String(500), nullable=True)
    generated_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    user = relationship("User")
    job = relationship("Job", back_populates="recommendations")
class ATSReport(Base):
    __tablename__ = "atsreports"
    ats_report_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.job_id"), nullable=True) 
    ats_score = Column(Float, nullable=True)
    match_percentage = Column(Float, nullable=True)
    missing_skills = Column(JSON, nullable=True)
    missing_keywords = Column(JSON, nullable=True)
    suggestions = Column(String, nullable=True)
    analyzed_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    user = relationship("User")
    job = relationship("Job", back_populates="ats_reports")
class Notification(Base):
    __tablename__ = "notifications"
    notification_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    user = relationship("User")