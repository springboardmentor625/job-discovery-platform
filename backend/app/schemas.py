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