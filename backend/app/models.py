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
        String(100),
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