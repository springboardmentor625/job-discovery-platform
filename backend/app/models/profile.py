from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, func, JSON
from sqlalchemy.orm import relationship
import uuid
from app.database.base import Base

class Profile(Base):
    __tablename__ = "profiles"

    profile_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True)
    headline = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    location = Column(String, nullable=True)
    skills = Column(JSON, default=list)
    experience_years = Column(Integer, default=0)
    education = Column(JSON, default=list) # e.g. [{"degree": "BSc", "institution": "XYZ"}]
    expected_salary = Column(Integer, nullable=True)
    notice_period = Column(String, nullable=True)
    resume_headline = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="profile")
