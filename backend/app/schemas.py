from pydantic import BaseModel, EmailStr, Field, ConfigDict


# =========================================================
# REGISTER
# =========================================================

class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=20)
    role: str = "CANDIDATE"
    phone: str | None = Field(
        default=None,
        min_length=10,
        max_length=10
    )


# =========================================================
# LOGIN
# =========================================================

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


# =========================================================
# USER RESPONSE
# =========================================================

class UserResponse(BaseModel):
    user_id: int
    full_name: str
    email: str
    role: str
    phone: str | None
    is_verified: bool

    model_config = ConfigDict(
        from_attributes=True
    )


# =========================================================
# JWT TOKEN
# =========================================================

class Token(BaseModel):
    access_token: str
    token_type: str

# =========================================================
# CANDIDATE PROFILE
# =========================================================

from pydantic import BaseModel, Field


class CandidateProfileCreate(BaseModel):
    headline: str = Field(..., min_length=1, max_length=255)
    summary: str = Field(..., min_length=1)
    location: str = Field(..., min_length=1, max_length=150)

    experience_years: float | None = None

    education: str | None = None
    projects: str | None = None
    certifications: str | None = None

    preferred_job_type: str | None = None
    preferred_location: str | None = None
    preferred_role: str | None = None

    expected_salary: float | None = None


class CandidateProfileResponse(BaseModel):
    profile_id: int
    user_id: int
    headline: str | None
    summary: str | None
    location: str | None
    experience_years: float | None
    education: object | None
    projects: object | None
    certifications: object | None
    preferred_job_type: str | None
    preferred_location: str | None

    class Config:
        from_attributes = True
