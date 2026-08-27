from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)
from pydantic import BaseModel
from typing import Optional

from ..database import get_db
from ..models import User, CandidateProfile
from ..utils.security import verify_access_token


router = APIRouter(
    prefix="/api/profile",
    tags=["Candidate Profile"]
)

security = HTTPBearer()


# =========================================================
# REQUEST MODEL
# =========================================================

class ProfileRequest(BaseModel):

    headline: Optional[str] = None

    summary: Optional[str] = None

    location: Optional[str] = None

    experience_years: Optional[float] = None

    education: Optional[dict] = None

    projects: Optional[list] = None

    certifications: Optional[list] = None

    preferred_job_type: Optional[str] = None

    preferred_location: Optional[str] = None


# =========================================================
# HELPER FUNCTION
# =========================================================

def get_current_user_id(
    credentials: HTTPAuthorizationCredentials
):

    token = credentials.credentials

    payload = verify_access_token(token)

    if payload is None:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user_id = payload.get("sub")

    if user_id is None:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    try:

        return int(user_id)

    except (TypeError, ValueError):

        raise HTTPException(
            status_code=401,
            detail="Invalid user ID in token"
        )


# =========================================================
# CREATE / SAVE PROFILE
# =========================================================

@router.post("/")
def create_profile(
    request: ProfileRequest,
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db=Depends(get_db)
):

    # -----------------------------------------------------
    # 1. GET USER ID
    # -----------------------------------------------------

    user_id = get_current_user_id(credentials)

    # -----------------------------------------------------
    # 2. CHECK USER
    # -----------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.user_id == user_id
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # -----------------------------------------------------
    # 3. CHECK EXISTING PROFILE
    # -----------------------------------------------------

    existing_profile = (
        db.query(CandidateProfile)
        .filter(
            CandidateProfile.user_id == user_id
        )
        .first()
    )

    if existing_profile:

        raise HTTPException(
            status_code=400,
            detail="Candidate profile already exists. Use PUT to update it."
        )

    # -----------------------------------------------------
    # 4. VALIDATE EXPERIENCE
    # -----------------------------------------------------

    if request.experience_years is not None:

        if request.experience_years < 0:

            raise HTTPException(
                status_code=400,
                detail="Experience years cannot be negative"
            )

    # -----------------------------------------------------
    # 5. CREATE PROFILE
    # -----------------------------------------------------

    new_profile = CandidateProfile(

        user_id=user_id,

        headline=request.headline,

        summary=request.summary,

        location=request.location,

        experience_years=request.experience_years,

        education=request.education,

        projects=request.projects,

        certifications=request.certifications,

        preferred_job_type=request.preferred_job_type,

        preferred_location=request.preferred_location
    )

    db.add(new_profile)

    try:

        db.commit()

        db.refresh(new_profile)

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

    # -----------------------------------------------------
    # 6. RETURN RESPONSE
    # -----------------------------------------------------

    return {

        "message": "Candidate profile created successfully",

        "profile_id": new_profile.profile_id,

        "user_id": new_profile.user_id,

        "headline": new_profile.headline,

        "summary": new_profile.summary,

        "location": new_profile.location,

        "experience_years": new_profile.experience_years,

        "education": new_profile.education,

        "projects": new_profile.projects,

        "certifications": new_profile.certifications,

        "preferred_job_type": new_profile.preferred_job_type,

        "preferred_location": new_profile.preferred_location
    }


# =========================================================
# GET PROFILE
# =========================================================

@router.get("/")
def get_profile(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db=Depends(get_db)
):

    # -----------------------------------------------------
    # 1. GET USER ID
    # -----------------------------------------------------

    user_id = get_current_user_id(credentials)

    # -----------------------------------------------------
    # 2. GET PROFILE
    # -----------------------------------------------------

    profile = (
        db.query(CandidateProfile)
        .filter(
            CandidateProfile.user_id == user_id
        )
        .first()
    )

    if not profile:

        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found"
        )

    # -----------------------------------------------------
    # 3. RETURN PROFILE
    # -----------------------------------------------------

    return {

        "profile_id": profile.profile_id,

        "user_id": profile.user_id,

        "headline": profile.headline,

        "summary": profile.summary,

        "location": profile.location,

        "experience_years": profile.experience_years,

        "education": profile.education,

        "projects": profile.projects,

        "certifications": profile.certifications,

        "preferred_job_type": profile.preferred_job_type,

        "preferred_location": profile.preferred_location
    }


# =========================================================
# UPDATE PROFILE
# =========================================================

@router.put("/")
def update_profile(
    request: ProfileRequest,
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db=Depends(get_db)
):

    # -----------------------------------------------------
    # 1. GET USER ID
    # -----------------------------------------------------

    user_id = get_current_user_id(credentials)

    # -----------------------------------------------------
    # 2. FIND PROFILE
    # -----------------------------------------------------

    profile = (
        db.query(CandidateProfile)
        .filter(
            CandidateProfile.user_id == user_id
        )
        .first()
    )

    if not profile:

        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found. Create the profile first."
        )

    # -----------------------------------------------------
    # 3. VALIDATE EXPERIENCE
    # -----------------------------------------------------

    if request.experience_years is not None:

        if request.experience_years < 0:

            raise HTTPException(
                status_code=400,
                detail="Experience years cannot be negative"
            )

    # -----------------------------------------------------
    # 4. UPDATE FIELDS
    # -----------------------------------------------------

    profile.headline = request.headline

    profile.summary = request.summary

    profile.location = request.location

    profile.experience_years = request.experience_years

    profile.education = request.education

    profile.projects = request.projects

    profile.certifications = request.certifications

    profile.preferred_job_type = request.preferred_job_type

    profile.preferred_location = request.preferred_location

    # -----------------------------------------------------
    # 5. SAVE
    # -----------------------------------------------------

    try:

        db.commit()

        db.refresh(profile)

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

    # -----------------------------------------------------
    # 6. RETURN RESPONSE
    # -----------------------------------------------------

    return {

        "message": "Candidate profile updated successfully",

        "profile_id": profile.profile_id,

        "user_id": profile.user_id,

        "headline": profile.headline,

        "summary": profile.summary,

        "location": profile.location,

        "experience_years": profile.experience_years,

        "education": profile.education,

        "projects": profile.projects,

        "certifications": profile.certifications,

        "preferred_job_type": profile.preferred_job_type,

        "preferred_location": profile.preferred_location
    }