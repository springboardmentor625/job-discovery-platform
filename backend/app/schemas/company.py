from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.company import VerificationStatus

class CompanyBase(BaseModel):
    company_name: str
    logo: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    company_size: Optional[str] = None
    about: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(CompanyBase):
    company_name: Optional[str] = None
    verification_status: Optional[VerificationStatus] = None

class CompanyInDBBase(CompanyBase):
    company_id: str
    user_id: Optional[str] = None
    verification_status: VerificationStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Company(CompanyInDBBase):
    pass
