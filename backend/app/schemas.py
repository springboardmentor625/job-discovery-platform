from pydantic import BaseModel
from typing import Optional


class CandidateProfileCreate(BaseModel):

    headline: Optional[str] = None

    bio: Optional[str] = None

    location: Optional[str] = None

    education: Optional[str] = None

    skills: Optional[str] = None

    experience: Optional[str] = None

    preferred_role: Optional[str] = None

    preferred_location: Optional[str] = None

    expected_salary: Optional[str] = None