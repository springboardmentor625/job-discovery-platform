from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SkillDNAIn(BaseModel):
    category: str = Field(default="Technical", description="Category: Technical, Domain, Soft, Tooling")
    skill_name: str = Field(min_length=1, max_length=100)
    proficiency_level: int = Field(default=3, ge=1, le=5)
    years_experience: float = Field(default=1.0, ge=0.0)


class SkillDNAOut(BaseModel):
    id: int
    user_id: int
    category: str
    skill_name: str
    proficiency_level: int
    years_experience: float
    verified: bool
    ai_confidence_score: float
    endorsements_count: int
    created_at: datetime


class SkillEndorsementIn(BaseModel):
    rating: int = Field(default=5, ge=1, le=5)
    comment: str = ""


class SkillEndorsementOut(BaseModel):
    id: int
    skill_dna_id: int
    endorser_id: int
    comment: str
    rating: int
    created_at: datetime


class SkillDNAProfileOut(BaseModel):
    user_id: int
    skills: list[SkillDNAOut]
    radar_metrics: dict[str, float]
    total_verified: int
    total_skills: int
