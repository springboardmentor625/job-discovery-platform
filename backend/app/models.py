from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    Numeric,
    JSON,
)
from sqlalchemy.orm import relationship

from .database import Base


# =========================================================
# 1. USERS
# =========================================================

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    role = Column(String(30), nullable=False)
    phone = Column(String(10), nullable=True)
    profile_picture = Column(Text, nullable=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    candidate_profile = relationship(
        "CandidateProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    resumes = relationship(
        "Resume",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    applications = relationship(
        "Application",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    swipe_history = relationship(
        "SwipeHistory",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    recommendations = relationship(
        "Recommendation",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan"
    )


# =========================================================
# 2. CANDIDATE PROFILES
# =========================================================

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    profile_id = Column(Integer, primary_key=True)
    user_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True
    )
    headline = Column(String(255), nullable=True)
    summary = Column(Text, nullable=True)
    location = Column(String(150), nullable=True)
    experience_years = Column(Numeric(4, 1), nullable=True)
    education = Column(JSON, nullable=True)
    projects = Column(JSON, nullable=True)
    certifications = Column(JSON, nullable=True)
    preferred_job_type = Column(String(50), nullable=True)
    preferred_location = Column(String(150), nullable=True)

    user = relationship(
        "User",
        back_populates="candidate_profile"
    )


# =========================================================
# 3. COMPANIES
# =========================================================

class Company(Base):
    __tablename__ = "companies"

    company_id = Column(Integer, primary_key=True)
    company_name = Column(String(200), nullable=False)
    company_type = Column(String(100), nullable=True)
    industry = Column(String(100), nullable=True)
    website = Column(Text, nullable=True)
    headquarters = Column(String(200), nullable=True)

    jobs = relationship(
        "Job",
        back_populates="company",
        cascade="all, delete-orphan"
    )


# =========================================================
# 4. JOBS
# =========================================================

class Job(Base):
    __tablename__ = "jobs"

    job_id = Column(Integer, primary_key=True)

    company_id = Column(
        Integer,
        ForeignKey("companies.company_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(150), nullable=True)
    employment_type = Column(String(50), nullable=True)
    salary_min = Column(Numeric(12, 2), nullable=True)
    salary_max = Column(Numeric(12, 2), nullable=True)
    experience_required = Column(Numeric(4, 1), nullable=True)
    required_skills = Column(JSON, nullable=True)
    posted_date = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )
    status = Column(
        String(30),
        nullable=False,
        default="ACTIVE"
    )

    company = relationship(
        "Company",
        back_populates="jobs"
    )

    applications = relationship(
        "Application",
        back_populates="job",
        cascade="all, delete-orphan"
    )

    swipe_history = relationship(
        "SwipeHistory",
        back_populates="job",
        cascade="all, delete-orphan"
    )

    ats_reports = relationship(
        "ATSReport",
        back_populates="job",
        cascade="all, delete-orphan"
    )

    recommendations = relationship(
        "Recommendation",
        back_populates="job",
        cascade="all, delete-orphan"
    )


# =========================================================
# 5. RESUMES
# =========================================================

class Resume(Base):
    __tablename__ = "resumes"

    resume_id = Column(Integer, primary_key=True)

    user_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    resume_name = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    extracted_skills = Column(JSON, nullable=True)
    uploaded_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )
    is_default = Column(
        Boolean,
        nullable=False,
        default=False
    )

    user = relationship(
        "User",
        back_populates="resumes"
    )

    applications = relationship(
        "Application",
        back_populates="resume"
    )

    ats_reports = relationship(
        "ATSReport",
        back_populates="resume",
        cascade="all, delete-orphan"
    )


# =========================================================
# 6. APPLICATIONS
# =========================================================

class Application(Base):
    __tablename__ = "applications"

    application_id = Column(Integer, primary_key=True)

    user_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    job_id = Column(
        Integer,
        ForeignKey("jobs.job_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    resume_id = Column(
        Integer,
        ForeignKey("resumes.resume_id", ondelete="SET NULL"),
        nullable=True
    )

    status = Column(
        String(30),
        nullable=False,
        default="APPLIED"
    )

    applied_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    user = relationship(
        "User",
        back_populates="applications"
    )

    job = relationship(
        "Job",
        back_populates="applications"
    )

    resume = relationship(
        "Resume",
        back_populates="applications"
    )


# =========================================================
# 7. SWIPE HISTORY
# =========================================================

class SwipeHistory(Base):
    __tablename__ = "swipe_history"

    swipe_id = Column(Integer, primary_key=True)

    user_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    job_id = Column(
        Integer,
        ForeignKey("jobs.job_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    swipe_action = Column(
        String(10),
        nullable=False
    )

    swiped_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    user = relationship(
        "User",
        back_populates="swipe_history"
    )

    job = relationship(
        "Job",
        back_populates="swipe_history"
    )


# =========================================================
# 8. ATS REPORTS
# =========================================================

class ATSReport(Base):
    __tablename__ = "ats_reports"

    ats_report_id = Column(Integer, primary_key=True)

    resume_id = Column(
        Integer,
        ForeignKey("resumes.resume_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    job_id = Column(
        Integer,
        ForeignKey("jobs.job_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    ats_score = Column(
        Numeric(5, 2),
        nullable=True
    )

    match_percentage = Column(
        Numeric(5, 2),
        nullable=True
    )

    missing_skills = Column(JSON, nullable=True)
    missing_keywords = Column(JSON, nullable=True)
    suggestions = Column(Text, nullable=True)

    analyzed_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    resume = relationship(
        "Resume",
        back_populates="ats_reports"
    )

    job = relationship(
        "Job",
        back_populates="ats_reports"
    )


# =========================================================
# 9. RECOMMENDATIONS
# =========================================================

class Recommendation(Base):
    __tablename__ = "recommendations"

    recommendation_id = Column(Integer, primary_key=True)

    user_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    job_id = Column(
        Integer,
        ForeignKey("jobs.job_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    recommendation_score = Column(
        Numeric(5, 2),
        nullable=True
    )

    recommendation_reason = Column(
        Text,
        nullable=True
    )

    generated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    user = relationship(
        "User",
        back_populates="recommendations"
    )

    job = relationship(
        "Job",
        back_populates="recommendations"
    )


# =========================================================
# 10. NOTIFICATIONS
# =========================================================

class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True)

    user_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)

    is_read = Column(
        Boolean,
        nullable=False,
        default=False
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    user = relationship(
        "User",
        back_populates="notifications"
    )