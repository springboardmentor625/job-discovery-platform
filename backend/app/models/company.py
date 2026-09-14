from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Enum, func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.database.base import Base

class VerificationStatus(str, enum.Enum):
    pending = "Pending"
    approved = "Approved"
    rejected = "Rejected"

class Company(Base):
    __tablename__ = "companies"

    company_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True) # owner recruiter
    company_name = Column(String, nullable=False)
    logo = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    website = Column(String, nullable=True)
    company_size = Column(String, nullable=True)
    about = Column(String, nullable=True)
    verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="companies")
    jobs = relationship("Job", back_populates="company", cascade="all, delete-orphan")
