from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.application import ApplicationStatus
from app.schemas.job import Job
from app.schemas.resume import Resume
from app.schemas.user import User

class ApplicationBase(BaseModel):
    cover_letter: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    job_id: str
    resume_id: Optional[str] = None

class ApplicationUpdate(BaseModel):
    status: ApplicationStatus

class ApplicationInDBBase(ApplicationBase):
    application_id: str
    user_id: str
    job_id: str
    resume_id: Optional[str]
    status: ApplicationStatus
    applied_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Application(ApplicationInDBBase):
    pass

class ApplicationWithDetails(ApplicationInDBBase):
    job: Optional[Job] = None
    resume: Optional[Resume] = None
    user: Optional[User] = None
