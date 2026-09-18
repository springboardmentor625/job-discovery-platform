from pydantic import BaseModel, EmailStr, Field
from typing import Optional


# ==========================================
# AUTHENTICATION
#
# Sent as a JSON request body (not query
# parameters), so a candidate's password never
# ends up in the request URL — and therefore
# never in server access logs, proxy logs, or
# browser history.
# ==========================================

class RegisterRequest(BaseModel):

    full_name: str

    email: EmailStr

    password: str

    phone: str


# ==========================================
# CANDIDATE PROFILE
# ==========================================

class CandidateProfileCreate(BaseModel):

    headline: Optional[str] = None

    bio: Optional[str] = None

    location: Optional[str] = None

    education: Optional[str] = None

    skills: Optional[str] = None

    experience_years: Optional[int] = Field(default=None, ge=0, le=80)

    preferred_role: Optional[str] = None

    preferred_location: Optional[str] = None

    # ge=10001 is the single source of truth for "must be more than
    # ₹10,000" — a separate field_validator re-checking the same
    # ">10000" condition used to live here too (dead, redundant code).
    expected_salary: Optional[int] = Field(
        default=None,
        ge=10001,
        description="Must be more than ₹10,000."
    )