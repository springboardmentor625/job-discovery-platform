import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Text, Boolean, Integer, DateTime, ForeignKey, func, Enum,Column, String
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50)) # 'candidate' or 'recruiter'
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    
    # Microsoft Careers Style Gamified Profile Fields
    full_name: Mapped[str] = mapped_column(String(150))
    country_code: Mapped[Optional[str]] = mapped_column(String(5))
    phone_number: Mapped[Optional[str]] = mapped_column(String(30))
    location: Mapped[Optional[str]] = mapped_column(String(150))
    about_bio: Mapped[Optional[str]] = mapped_column(Text)
    linkedin_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    
    # Complex JSON Arrays
    skills: Mapped[List[str]] = mapped_column(JSONB, server_default="[]")
    education: Mapped[List[Dict[str, Any]]] = mapped_column(JSONB, server_default="[]")
    experience: Mapped[List[Dict[str, Any]]] = mapped_column(JSONB, server_default="[]")
    
    profile_health_score: Mapped[int] = mapped_column(Integer, default=0)

class RecruiterProfile(Base):
    __tablename__ = "recruiter_profiles"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    company_name: Mapped[str] = mapped_column(String(150))
    industry: Mapped[Optional[str]] = mapped_column(String(100))
    website: Mapped[Optional[str]] = mapped_column(String(255))

class Resume(Base):
    __tablename__ = "resumes"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    file_url: Mapped[str] = mapped_column(String(500))
    raw_text: Mapped[str] = mapped_column(Text)
    embedding: Mapped[List[float]] = mapped_column(Vector(384), nullable=True)

class Job(Base):
    __tablename__ = "jobs"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recruiter_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(200))
    company_name: Mapped[str] = mapped_column(String(150))
    location: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    description: Mapped[str] = mapped_column(Text)
    required_skills: Mapped[List[str]] = mapped_column(JSONB, server_default="[]")
    embedding: Mapped[List[float]] = mapped_column(Vector(384), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class Application(Base):
    __tablename__ = "applications"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"))
    swipe_direction: Mapped[str] = mapped_column(String(10)) # 'right' or 'left'
    recruiter_status: Mapped[str] = mapped_column(String(50), default="pending") 
    
    # Strict ATS Workflow Storage (Score, Missing Skills, Suggestions)
    ats_report: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())