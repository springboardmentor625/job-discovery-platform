from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ProfileBase(BaseModel):
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    skills: List[str] = []
    experience_years: Optional[int] = 0
    education: List[Dict[str, Any]] = []
    expected_salary: Optional[int] = None
    notice_period: Optional[str] = None
    resume_headline: Optional[str] = None

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(ProfileBase):
    pass

class ProfileInDBBase(ProfileBase):
    profile_id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Profile(ProfileInDBBase):
    pass
