from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ResumeBase(BaseModel):
    title: str

class ResumeCreate(ResumeBase):
    pass

class ResumeUpdate(ResumeBase):
    title: Optional[str] = None
    is_primary: Optional[bool] = None

class ResumeInDBBase(ResumeBase):
    resume_id: str
    user_id: str
    file_path: str
    file_type: str
    file_size: int
    ats_score: Optional[int] = None
    extracted_skills: List[str] = []
    missing_keywords: List[str] = []
    uploaded_at: datetime
    is_primary: bool

    class Config:
        from_attributes = True

class Resume(ResumeInDBBase):
    pass

class ResumeAnalysis(BaseModel):
    ats_score: int
    extracted_skills: List[str]
    missing_keywords: List[str]
    missing_skills: List[str]
    improvement_suggestions: List[str]
