from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Enum, func, JSON
from sqlalchemy.orm import relationship
import uuid
import enum
from app.database.base import Base

class JobStatus(str, enum.Enum):
    active = "Active"
    closed = "Closed"
    draft = "Draft"

class Job(Base):
    __tablename__ = "jobs"

    job_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    recruiter_id = Column(String, ForeignKey("users.user_id", ondelete="CASCADE"))
    company_id = Column(String, ForeignKey("companies.company_id", ondelete="CASCADE"))
    job_title = Column(String, nullable=False)
    job_description = Column(String, nullable=False)
    required_skills = Column(JSON, default=list)
    experience_required = Column(Integer, nullable=True) # in years
    location = Column(String, nullable=True)
    job_type = Column(String, nullable=True) # Full-time, Part-time, Remote, etc.
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    posted_date = Column(DateTime(timezone=True), server_default=func.now())
    closing_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(JobStatus), default=JobStatus.active)
    views_count = Column(Integer, default=0)
    applicant_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    company = relationship("Company", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
    swipes = relationship("Swipe", back_populates="job", cascade="all, delete-orphan")
    saved_jobs = relationship("SavedJob", back_populates="job", cascade="all, delete-orphan")

    @property
    def company_name(self) -> str | None:
        return self.company.company_name if self.company else None
        
    @property
    def company_logo(self) -> str | None:
        return self.company.logo if self.company else None
