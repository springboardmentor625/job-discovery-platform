from sqlalchemy import Column, String, ForeignKey, DateTime, Enum, func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.database.base import Base

class ApplicationStatus(str, enum.Enum):
    applied = "Applied"
    shortlisted = "Shortlisted"
    interview = "Interview"
    rejected = "Rejected"
    offer = "Offer"
    hired = "Hired"

class Application(Base):
    __tablename__ = "applications"

    application_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.user_id", ondelete="CASCADE"))
    job_id = Column(String, ForeignKey("jobs.job_id", ondelete="CASCADE"))
    resume_id = Column(String, ForeignKey("resumes.resume_id", ondelete="SET NULL"), nullable=True)
    cover_letter = Column(String, nullable=True)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.applied)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    resume = relationship("Resume", back_populates="applications")
