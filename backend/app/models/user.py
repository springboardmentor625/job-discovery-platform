from sqlalchemy import Column, String, Boolean, DateTime, Enum, func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.database.base import Base

class UserRole(str, enum.Enum):
    job_seeker = "JobSeeker"
    recruiter = "Recruiter"
    admin = "Admin"

class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    phone = Column(String, nullable=True)
    profile_image = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    companies = relationship("Company", back_populates="owner")
    applications = relationship("Application", back_populates="user")
    swipes = relationship("Swipe", back_populates="user")
    saved_jobs = relationship("SavedJob", back_populates="user")
