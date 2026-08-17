from pydantic import BaseModel, Field, field_validator
from typing import Optional


# ==========================================
# EXPERIENCE LEVELS
# ==========================================

EXPERIENCE_LEVELS = [
    "Fresher / Entry-Level",
    "Intern",
    "Trainee",
    "Junior / Associate",
    "Mid-Level",
    "Senior-Level",
    "Lead",
    "Manager",
    "Experienced Professional",
]


# ==========================================
# CANDIDATE PROFILE
# ==========================================

class CandidateProfileCreate(BaseModel):

    headline: Optional[str] = None

    bio: Optional[str] = None

    location: Optional[str] = None

    education: Optional[str] = None

    skills: Optional[str] = None

    experience: Optional[str] = None

    preferred_role: Optional[str] = None

    preferred_location: Optional[str] = None

    expected_salary: Optional[int] = Field(
        default=None,
        ge=10001
    )

    # ======================================
    # EXPERIENCE VALIDATION
    # ======================================

    @field_validator("experience")
    @classmethod
    def validate_experience(cls, value):

        # Allow empty experience
        if value is None or value.strip() == "":
            return value

        # Reject Swagger placeholder
        if value.strip().lower() == "string":
            raise ValueError(
                "Please select a valid experience level"
            )

        # Check against allowed levels
        if value not in EXPERIENCE_LEVELS:
            raise ValueError(
                "Please select a valid experience level"
            )

        return value

    # ======================================
    # SALARY VALIDATION
    # ======================================

    @field_validator("expected_salary")
    @classmethod
    def validate_salary(cls, value):

        if value is None:
            return value

        if value <= 10000:
            raise ValueError(
                "Expected salary must be more than ₹10,000"
            )

        return value