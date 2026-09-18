from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import CandidateProfile, User
from ..auth import get_current_user
from .job_routes import invalidate_recommendation_cache
from ..schemas import CandidateProfileCreate


router = APIRouter(
    prefix="/api/candidate",
    tags=["Candidate Profile"]
)


# ==========================================
# CREATE PROFILE
# ==========================================

@router.post("/profile")
def create_profile(
    profile_data: CandidateProfileCreate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    existing_profile = db.query(
        CandidateProfile
    ).filter(
        CandidateProfile.user_id == user_id
    ).first()

    if existing_profile:

        raise HTTPException(
            status_code=400,
            detail="Candidate profile already exists"
        )

    profile = CandidateProfile(
        user_id=user_id,
        headline=profile_data.headline,
        bio=profile_data.bio,
        location=profile_data.location,
        education=profile_data.education,
        skills=profile_data.skills,
        experience_years=profile_data.experience_years,
        preferred_role=profile_data.preferred_role,
        preferred_location=profile_data.preferred_location,
        expected_salary=profile_data.expected_salary
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)
    invalidate_recommendation_cache(user_id)

    return {
        "message": "Candidate profile created successfully",
        "profile_id": profile.profile_id
    }


# ==========================================
# GET PROFILE
# ==========================================

@router.get("/profile")
def get_profile(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    profile = db.query(
        CandidateProfile
    ).filter(
        CandidateProfile.user_id == user_id
    ).first()

    if not profile:

        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found"
        )

    user = db.query(
        User
    ).filter(
        User.user_id == user_id
    ).first()

    return {
        "profile_id": profile.profile_id,
        "user_id": profile.user_id,
        "full_name": user.full_name if user else None,
        "headline": profile.headline,
        "bio": profile.bio,
        "location": profile.location,
        "education": profile.education,
        "skills": profile.skills,
        "experience_years": profile.experience_years,
        "preferred_role": profile.preferred_role,
        "preferred_location": profile.preferred_location,
        "expected_salary": profile.expected_salary
    }


# ==========================================
# CREATE OR UPDATE PROFILE
# ==========================================

@router.put("/profile")
def update_profile(
    profile_data: CandidateProfileCreate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    profile = db.query(
        CandidateProfile
    ).filter(
        CandidateProfile.user_id == user_id
    ).first()


    # ======================================
    # PROFILE DOES NOT EXIST
    # CREATE PROFILE
    # ======================================

    if not profile:

        profile = CandidateProfile(
            user_id=user_id,
            headline=profile_data.headline,
            bio=profile_data.bio,
            location=profile_data.location,
            education=profile_data.education,
            skills=profile_data.skills,
            experience_years=profile_data.experience_years,
            preferred_role=profile_data.preferred_role,
            preferred_location=profile_data.preferred_location,
            expected_salary=profile_data.expected_salary
        )

        db.add(profile)

        db.commit()

        db.refresh(profile)
        invalidate_recommendation_cache(user_id)

        return {
            "message": "Candidate profile created successfully",
            "profile_id": profile.profile_id
        }


    # ======================================
    # PROFILE EXISTS
    # UPDATE PROFILE
    # ======================================

    if profile_data.headline is not None:
        profile.headline = profile_data.headline

    if profile_data.bio is not None:
        profile.bio = profile_data.bio

    if profile_data.location is not None:
        profile.location = profile_data.location

    if profile_data.education is not None:
        profile.education = profile_data.education

    if profile_data.skills is not None:
        profile.skills = profile_data.skills

    if profile_data.experience_years is not None:
        profile.experience_years = profile_data.experience_years

    if profile_data.preferred_role is not None:
        profile.preferred_role = profile_data.preferred_role

    if profile_data.preferred_location is not None:
        profile.preferred_location = profile_data.preferred_location

    if profile_data.expected_salary is not None:
        profile.expected_salary = profile_data.expected_salary


    db.commit()

    db.refresh(profile)
    invalidate_recommendation_cache(user_id)


    return {
        "message": "Candidate profile updated successfully",
        "profile_id": profile.profile_id
    }
