from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    UniqueConstraint
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
        ForeignKey("users.user_id"),
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

    experience_years = Column(
        Integer,
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
        ForeignKey("users.user_id"),
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

    # ==========================================
    # EXTRACTED RESUME DATA
    # ==========================================

    extracted_text = Column(
        String,
        nullable=True
    )

    extracted_skills = Column(
        String(2000),
        nullable=True
    )

    extracted_experience = Column(
        String(2000),
        nullable=True
    )

    extracted_education = Column(
        String(2000),
        nullable=True
    )

    # ==========================================
    # RESUME STATUS
    # ==========================================

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
        ForeignKey("users.user_id"),
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

    # ==========================================
    # COMPANY TYPE (for MNC / Startup filtering)
    # Nullable: not populated for existing
    # imported test data until set explicitly.
    # ==========================================

    company_type = Column(
        String(30),
        nullable=True
    )

    # ==========================================
    # PREFERRED (NICE-TO-HAVE) SKILLS
    # Separate from the required `skills` field,
    # used by ats_service's preferred_skills_match
    # component. Nullable: unpopulated for
    # existing imported test data — that
    # component returns a neutral score rather
    # than penalizing jobs with no data here.
    # ==========================================

    preferred_skills = Column(
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
        ForeignKey("users.user_id"),
        nullable=False,
        index=True
    )

    job_id = Column(
        Integer,
        ForeignKey("jobs.job_id"),
        nullable=False,
        index=True
    )

    action = Column(
        String(20),
        nullable=False
    )

    # ==========================================
    # MATCH SCORE AT TIME OF SWIPE
    # Persisted so we can show a genuine trend
    # (this week vs last week) later, rather
    # than recomputing history that no longer
    # reflects the candidate's current profile.
    # ==========================================

    match_score = Column(
        Float,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


class SavedJob(Base):

    __tablename__ = "saved_jobs"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "job_id",
            name="uq_saved_job_user_job"
        ),
    )

    saved_job_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False,
        index=True
    )

    job_id = Column(
        Integer,
        ForeignKey("jobs.job_id"),
        nullable=False,
        index=True
    )

    saved_at = Column(
        DateTime,
        default=datetime.utcnow
    )
# ==========================================
# NOTE: The `Application` model (apply/track
# applications feature) was removed from the
# ORM layer per product decision to drop that
# feature. The `applications` table itself was
# NOT dropped from the database — if it already
# has real application rows, deleting it would
# lose that data. It's just no longer modeled
# or written to by this codebase.
# ==========================================


class ATSReport(Base):

    __tablename__ = "ats_reports"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "job_id",
            name="uq_ats_report_user_job"
        ),
    )

    report_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False,
        index=True
    )

    job_id = Column(
        Integer,
        ForeignKey("jobs.job_id"),
        nullable=False,
        index=True
    )

    resume_id = Column(
        Integer,
        ForeignKey("resumes.resume_id"),
        nullable=False
    )

    ats_score = Column(
        Float,
        nullable=False
    )

    required_skills_score = Column(Float)
    preferred_skills_score = Column(Float)
    experience_score = Column(Float)
    semantic_score = Column(Float)
    education_score = Column(Float)

    missing_skills = Column(
        String(1000)
    )

    job_category = Column(
        String(100),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )
