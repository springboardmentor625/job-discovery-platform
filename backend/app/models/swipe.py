from sqlalchemy import Column, String, ForeignKey, DateTime, Enum, func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.database.base import Base

class SwipeType(str, enum.Enum):
    right = "Right"
    left = "Left"

class Swipe(Base):
    __tablename__ = "swipes"

    swipe_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.user_id", ondelete="CASCADE"))
    job_id = Column(String, ForeignKey("jobs.job_id", ondelete="CASCADE"))
    swipe_type = Column(Enum(SwipeType), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="swipes")
    job = relationship("Job", back_populates="swipes")
