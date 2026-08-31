from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .models import CandidateProfile, User, Resume
from .schemas import CandidateProfileCreate, CandidateProfileResponse, ProfileCompletionResponse
from .auth import get_current_user


router = APIRouter(
    prefix="/candidate-profile",
    tags=["Candidate Profile"]
)


@router.get("/completion", response_model=ProfileCompletionResponse)
def get_profile_completion(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculate dynamic profile completion percentage from actual records
    in users, candidate_profile, and resumes tables.
    """
    profile = db.query(CandidateProfile).filter(
        CandidateProfile.user_id == current_user.user_id
    ).first()

    resume_count = db.query(Resume).filter(
        Resume.user_id == current_user.user_id
    ).count()

    completed_fields = []
    missing_fields = []

    # 1. User fields
    if current_user.full_name:
        completed_fields.append("Full Name")
    else:
        missing_fields.append("Add your full name")

    if current_user.phone:
        completed_fields.append("Phone Number")
    else:
        missing_fields.append("Add contact phone number")

    # 2. Resume
    if resume_count > 0:
        completed_fields.append("Uploaded Resume")
    else:
        missing_fields.append("Upload a PDF resume")

    # 3. Profile fields
    if profile:
        if profile.headline and profile.headline.strip():
            completed_fields.append("Professional Headline")
        else:
            missing_fields.append("Add a professional headline")

        if profile.summary and profile.summary.strip():
            completed_fields.append("Professional Summary")
        else:
            missing_fields.append("Add a summary/bio")

        if profile.location and profile.location.strip():
            completed_fields.append("Current Location")
        else:
            missing_fields.append("Add current location")

        if profile.experience_years is not None and profile.experience_years >= 0:
            completed_fields.append("Years of Experience")
        else:
            missing_fields.append("Specify years of experience")

        if profile.preferred_job_type and profile.preferred_job_type.strip():
            completed_fields.append("Preferred Job Type")
        else:
            missing_fields.append("Set preferred job type (e.g., Full-time, Remote)")

        if profile.preferred_location and profile.preferred_location.strip():
            completed_fields.append("Preferred Location")
        else:
            missing_fields.append("Set preferred job location")

        if profile.education and (isinstance(profile.education, list) and len(profile.education) > 0 or isinstance(profile.education, str) and profile.education.strip()):
            completed_fields.append("Education")
        else:
            missing_fields.append("Add education history")

        if profile.projects and (isinstance(profile.projects, list) and len(profile.projects) > 0 or isinstance(profile.projects, str) and profile.projects.strip()):
            completed_fields.append("Projects")
        else:
            missing_fields.append("Add key projects")
    else:
        missing_fields.extend([
            "Add a professional headline",
            "Add a summary/bio",
            "Add current location",
            "Specify years of experience",
            "Set preferred job type",
            "Set preferred job location",
            "Add education history",
            "Add key projects"
        ])

    total_fields = len(completed_fields) + len(missing_fields)
    percentage = int(round((len(completed_fields) / total_fields) * 100)) if total_fields > 0 else 0

    return {
        "percentage": percentage,
        "completed_fields": completed_fields,
        "missing_fields": missing_fields,
        "total_fields": total_fields,
        "has_resume": resume_count > 0,
        "has_profile": profile is not None
    }


@router.post("/", response_model=CandidateProfileResponse)
def create_candidate_profile(
    profile: CandidateProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new candidate profile"""
    
    # Check if profile already exists for this user
    existing = db.query(CandidateProfile).filter(
        CandidateProfile.user_id == current_user.user_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Candidate profile already exists. Use PUT to update."
        )
    
    new_profile = CandidateProfile(
        user_id=current_user.user_id,
        headline=profile.headline,
        summary=profile.summary,
        location=profile.location,
        preferred_job_type=profile.preferred_job_type,
        preferred_location=profile.preferred_location,
        experience_years=profile.experience_years,
        education=profile.education,
        projects=profile.projects,
        certifications=profile.certifications
    )
    
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    
    return new_profile


@router.get("/", response_model=CandidateProfileResponse)
def get_candidate_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the current user's candidate profile"""
    
    profile = db.query(CandidateProfile).filter(
        CandidateProfile.user_id == current_user.user_id
    ).first()
    
    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found"
        )
    
    return profile


@router.put("/{profile_id}", response_model=CandidateProfileResponse)
def update_candidate_profile(
    profile_id: int,
    profile_update: CandidateProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a candidate profile"""
    
    profile = db.query(CandidateProfile).filter(
        CandidateProfile.profile_id == profile_id,
        CandidateProfile.user_id == current_user.user_id
    ).first()
    
    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found"
        )
    
    # Update fields
    if profile_update.headline is not None:
        profile.headline = profile_update.headline
    if profile_update.summary is not None:
        profile.summary = profile_update.summary
    if profile_update.location is not None:
        profile.location = profile_update.location
    if profile_update.preferred_job_type is not None:
        profile.preferred_job_type = profile_update.preferred_job_type
    if profile_update.preferred_location is not None:
        profile.preferred_location = profile_update.preferred_location
    if profile_update.experience_years is not None:
        profile.experience_years = profile_update.experience_years
    if profile_update.education is not None:
        profile.education = profile_update.education
    if profile_update.projects is not None:
        profile.projects = profile_update.projects
    if profile_update.certifications is not None:
        profile.certifications = profile_update.certifications
    
    db.commit()
    db.refresh(profile)
    
    return profile


@router.get("/{profile_id}", response_model=CandidateProfileResponse)
def get_profile_by_id(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific candidate profile (only if owner)"""
    
    profile = db.query(CandidateProfile).filter(
        CandidateProfile.profile_id == profile_id
    ).first()
    
    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found"
        )
    
    # Only allow user to view their own profile or admins
    if profile.user_id != current_user.user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view this profile"
        )
    
    return profile


@router.delete("/{profile_id}")
def delete_candidate_profile(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a candidate profile"""
    
    profile = db.query(CandidateProfile).filter(
        CandidateProfile.profile_id == profile_id,
        CandidateProfile.user_id == current_user.user_id
    ).first()
    
    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found"
        )
    
    db.delete(profile)
    db.commit()
    
    return {"message": "Candidate profile deleted"}
