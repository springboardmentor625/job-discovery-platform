from pydantic import BaseModel
from datetime import datetime
from app.schemas.job import Job

class SavedJobBase(BaseModel):
    job_id: str

class SavedJobCreate(SavedJobBase):
    pass

class SavedJobInDBBase(SavedJobBase):
    save_id: str
    user_id: str
    saved_at: datetime
    
    class Config:
        from_attributes = True

class SavedJob(SavedJobInDBBase):
    job: Job
