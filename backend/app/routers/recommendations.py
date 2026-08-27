
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Resume, Job
from ..utils.security import verify_access_token


router = APIRouter(
    prefix="/api/recommendations",
    tags=["Recommendations"]
)

security = HTTPBearer()


# =========================================================
# GET RECOMMENDED JOBS
# =========================================================

@router.get("/")
def get_recommended_jobs(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # 1. VERIFY TOKEN
    # -----------------------------------------------------

    token = credentials.credentials

    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    # -----------------------------------------------------
    # 2. GET USER ID
    # -----------------------------------------------------

    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    try:
        user_id = int(user_id)

    except (TypeError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid user ID in token"
        )

    # -----------------------------------------------------
    # 3. CHECK USER
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
    # 4. GET DEFAULT RESUME
    # -----------------------------------------------------

    resume = (
        db.query(Resume)
        .filter(
            Resume.user_id == user_id,
            Resume.is_default == True
        )
        .order_by(
            Resume.uploaded_at.desc()
        )
        .first()
    )

    # -----------------------------------------------------
    # 5. FALLBACK TO LATEST RESUME
    # -----------------------------------------------------

    if not resume:

        resume = (
            db.query(Resume)
            .filter(
                Resume.user_id == user_id
            )
            .order_by(
                Resume.uploaded_at.desc()
            )
            .first()
        )

    # -----------------------------------------------------
    # 6. CHECK RESUME
    # -----------------------------------------------------

    if not resume:
        raise HTTPException(
            status_code=404,
            detail=(
                "No resume found. "
                "Please upload a resume first."
            )
        )

    # -----------------------------------------------------
    # 7. GET RESUME SKILLS
    # -----------------------------------------------------

    resume_skills = resume.extracted_skills or []

    resume_skills_lower = {
        str(skill).strip().lower()
        for skill in resume_skills
        if skill
    }

    # -----------------------------------------------------
    # 8. GET ACTIVE JOBS
    # -----------------------------------------------------

    jobs = (
        db.query(Job)
        .filter(
            Job.status == "ACTIVE"
        )
        .order_by(
            Job.posted_date.desc()
        )
        .all()
    )

    recommendations = []

    # -----------------------------------------------------
    # 9. COMPARE RESUME SKILLS WITH JOB SKILLS
    # -----------------------------------------------------

    for job in jobs:

        required_skills = job.required_skills or []

        required_skills_lower = {
            str(skill).strip().lower()
            for skill in required_skills
            if skill
        }

        # -------------------------------------------------
        # FIND MATCHED SKILLS
        # -------------------------------------------------

        matched_skills = [
            skill
            for skill in required_skills
            if str(skill).strip().lower()
            in resume_skills_lower
        ]

        # -------------------------------------------------
        # FIND MISSING SKILLS
        # -------------------------------------------------

        missing_skills = [
            skill
            for skill in required_skills
            if str(skill).strip().lower()
            not in resume_skills_lower
        ]

        # -------------------------------------------------
        # CALCULATE MATCH PERCENTAGE
        # -------------------------------------------------

        if len(required_skills_lower) > 0:

            match_percentage = (
                len(matched_skills)
                / len(required_skills_lower)
            ) * 100

        else:

            match_percentage = 0

        recommendations.append(
            {
                "job_id": job.job_id,
                "company_id": job.company_id,
                "title": job.title,
                "description": job.description,
                "location": job.location,
                "employment_type": job.employment_type,
                "salary_min": job.salary_min,
                "salary_max": job.salary_max,
                "experience_required": job.experience_required,
                "required_skills": required_skills,
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "match_percentage": round(
                    match_percentage,
                    2
                )
            }
        )

    # -----------------------------------------------------
    # 10. SORT BY MATCH PERCENTAGE
    # -----------------------------------------------------

    recommendations.sort(
        key=lambda job: job["match_percentage"],
        reverse=True
    )

    # -----------------------------------------------------
    # 11. RETURN RESULTS
    # -----------------------------------------------------

    return {
        "user_id": user_id,
        "resume_id": resume.resume_id,
        "recommendations": recommendations
    }
