from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from app.core.dependencies import get_db, get_current_active_user
from app.models.user import User, UserRole
from app.models.profile import Profile
from app.schemas.profile import Profile as ProfileSchema, ProfileUpdate, ProfileCreate

router = APIRouter()


def _get_or_create_profile(db: Session, user: User) -> Profile:
    """Get existing profile or create one if it doesn't exist yet."""
    profile = db.query(Profile).filter(Profile.user_id == user.user_id).first()
    if not profile:
        profile = Profile(user_id=user.user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("/me", response_model=ProfileSchema)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get the current user's profile. Creates one if it doesn't exist."""
    if current_user.role != UserRole.job_seeker:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only job seekers have profiles.",
        )
    return _get_or_create_profile(db, current_user)


@router.put("/me", response_model=ProfileSchema)
def update_my_profile(
    *,
    db: Session = Depends(get_db),
    profile_in: ProfileUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Update the current user's profile fields."""
    if current_user.role != UserRole.job_seeker:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only job seekers have profiles.",
        )
    profile = _get_or_create_profile(db, current_user)
    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile
