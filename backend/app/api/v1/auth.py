from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Any

from app.core import security
from app.core.config import settings
from app.core.dependencies import get_current_active_user
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.profile import Profile
from app.schemas.auth import Token
from app.schemas.user import UserCreate, User as UserSchema

router = APIRouter()


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def register(*, db: Session = Depends(get_db), user_in: UserCreate) -> Any:
    """
    Register a new user (JobSeeker or Recruiter).
    Auto-creates a Profile for JobSeekers.
    """
    # Check for duplicate email — 409 Conflict per REST convention
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        email=user_in.email,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        password_hash=security.get_password_hash(user_in.password),
        role=user_in.role,
        phone=user_in.phone,
        profile_image=user_in.profile_image,
    )
    db.add(user)
    db.flush()  # Get user_id before commit

    # Auto-create a Profile for JobSeekers
    if user_in.role == UserRole.job_seeker:
        profile = Profile(user_id=user.user_id)
        db.add(profile)

    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    OAuth2 compatible token login — returns JWT with embedded role.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            subject=user.user_id,
            expires_delta=access_token_expires,
            role=user.role.value,
        ),
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserSchema)
def read_users_me(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get currently authenticated user."""
    return current_user
