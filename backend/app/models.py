from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime
)

from .database import Base


class User(Base):

    __tablename__ = "users"

    user_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    full_name = Column(
        String(150),
        nullable=False
    )

    email = Column(
        String(150),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    role = Column(
        String(30),
        default="candidate"
    )

    phone = Column(
        String(10),
        unique=True,
        nullable=False,
        index=True
    )

    is_verified = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


class CandidateProfile(Base):

    __tablename__ = "candidate_profiles"

    profile_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        nullable=False,
        unique=True
    )

    headline = Column(
        String(200),
        nullable=True
    )

    bio = Column(
        String(1000),
        nullable=True
    )

    location = Column(
        String(150),
        nullable=True
    )

    education = Column(
        String(1000),
        nullable=True
    )

    skills = Column(
        String(1000),
        nullable=True
    )

    experience = Column(
        String(1000),
        nullable=True
    )

    preferred_role = Column(
        String(200),
        nullable=True
    )

    preferred_location = Column(
        String(200),
        nullable=True
    )

    expected_salary = Column(
    Integer,
    nullable=True
)
class Resume(Base):

    __tablename__ = "resumes"

    resume_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    file_name = Column(
        String(255),
        nullable=False
    )

    file_path = Column(
        String(500),
        nullable=False
    )

    file_type = Column(
        String(50),
        nullable=False
    )

    extracted_text = Column(
        String,
        nullable=True
    )

    is_primary = Column(
        Boolean,
        default=True
    )

    uploaded_at = Column(
        DateTime,
        default=datetime.utcnow
    )
class Job(Base):

    __tablename__ = "jobs"

    job_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    recruiter_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    title = Column(
        String(200),
        nullable=False
    )

    company = Column(
        String(200),
        nullable=False
    )

    description = Column(
        String(5000),
        nullable=False
    )

    location = Column(
        String(200),
        nullable=False
    )

    employment_type = Column(
        String(50),
        nullable=False
    )

    experience_required = Column(
        String(100),
        nullable=True
    )

    salary = Column(
        String(100),
        nullable=True
    )

    skills = Column(
        String(1000),
        nullable=True
    )

    status = Column(
        String(30),
        default="active",
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )
class JobSwipe(Base):

    __tablename__ = "job_swipes"

    swipe_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    job_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    action = Column(
        String(20),
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )
class Application(Base):

    __tablename__ = "applications"

    application_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    job_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    status = Column(
        String(30),
        default="applied",
        nullable=False
    )

    applied_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
