from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Boolean, func, JSON
from sqlalchemy.orm import relationship
import uuid
from app.database.base import Base

class Resume(Base):
    __tablename__ = "resumes"

    resume_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.user_id", ondelete="CASCADE"))
    title = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False) # bytes
    ats_score = Column(Integer, nullable=True)
    extracted_skills = Column(JSON, default=list)
    missing_keywords = Column(JSON, default=list)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    is_primary = Column(Boolean, default=False)

    user = relationship("User", back_populates="resumes")
    applications = relationship("Application", back_populates="resume")
