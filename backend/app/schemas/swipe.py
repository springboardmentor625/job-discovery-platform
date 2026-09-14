from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.swipe import SwipeType

class SwipeBase(BaseModel):
    job_id: str
    swipe_type: SwipeType

class SwipeCreate(SwipeBase):
    pass

class SwipeInDBBase(SwipeBase):
    swipe_id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class Swipe(SwipeInDBBase):
    pass
