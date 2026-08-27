from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    User,
    Resume,
    Job,
    SwipeHistory,
    Application,
)
from ..utils.security import verify_access_token


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)

security = HTTPBearer()


# =========================================================
# CANDIDATE DASHBOARD
# =========================================================

@router.get("/candidate")
def get_candidate_dashboard(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # 1. VERIFY JWT
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
    # 3. GET USER
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
    # 4. GET LATEST RESUME
    # -----------------------------------------------------

    latest_resume = (
        db.query(Resume)
        .filter(
            Resume.user_id == user_id
        )
        .order_by(
            Resume.uploaded_at.desc()
        )
        .first()
    )

    resume_data = None

    if latest_resume:

        resume_data = {
            "resume_id": latest_resume.resume_id,
            "resume_name": latest_resume.resume_name,
            "file_path": latest_resume.file_path,
            "extracted_skills": latest_resume.extracted_skills,
            "uploaded_at": latest_resume.uploaded_at,
            "is_default": latest_resume.is_default
        }

    # -----------------------------------------------------
    # 5. GET SAVED JOBS
    # -----------------------------------------------------

    saved_swipes = (
        db.query(SwipeHistory)
        .filter(
            SwipeHistory.user_id == user_id,
            SwipeHistory.swipe_action == "SAVE"
        )
        .all()
    )

    saved_job_count = len(saved_swipes)

    # -----------------------------------------------------
    # 6. GET APPLICATIONS
    # -----------------------------------------------------

    applications = (
        db.query(Application)
        .filter(
            Application.user_id == user_id
        )
        .order_by(
            Application.applied_at.desc()
        )
        .all()
    )

    application_count = len(applications)

    # -----------------------------------------------------
    # 7. APPLICATION STATUS COUNTS
    # -----------------------------------------------------

    applied_count = 0
    shortlisted_count = 0
    rejected_count = 0
    selected_count = 0

    for application in applications:

        status = (
            application.status or ""
        ).upper()

        if status == "APPLIED":
            applied_count += 1

        elif status == "SHORTLISTED":
            shortlisted_count += 1

        elif status == "REJECTED":
            rejected_count += 1

        elif status == "SELECTED":
            selected_count += 1

    # -----------------------------------------------------
    # 8. RECENT APPLICATIONS
    # -----------------------------------------------------

    recent_applications = []

    for application in applications[:5]:

        job = (
            db.query(Job)
            .filter(
                Job.job_id == application.job_id
            )
            .first()
        )

        if not job:
            continue

        recent_applications.append({
            "application_id": application.application_id,
            "job_id": job.job_id,
            "company_id": job.company_id,
            "title": job.title,
            "location": job.location,
            "employment_type": job.employment_type,
            "status": application.status,
            "applied_at": application.applied_at
        })

    # -----------------------------------------------------
    # 9. RECENT SAVED JOBS
    # -----------------------------------------------------

    saved_swipes = sorted(
        saved_swipes,
        key=lambda x: x.swiped_at,
        reverse=True
    )

    recent_saved_jobs = []

    for swipe in saved_swipes[:5]:

        job = (
            db.query(Job)
            .filter(
                Job.job_id == swipe.job_id
            )
            .first()
        )

        if not job:
            continue

        recent_saved_jobs.append({
            "swipe_id": swipe.swipe_id,
            "job_id": job.job_id,
            "company_id": job.company_id,
            "title": job.title,
            "location": job.location,
            "employment_type": job.employment_type,
            "salary_min": job.salary_min,
            "salary_max": job.salary_max,
            "saved_at": swipe.swiped_at
        })

    # -----------------------------------------------------
    # 10. USER INFORMATION
    # -----------------------------------------------------

    user_data = {
        "user_id": user.user_id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "phone": user.phone,
        "profile_picture": user.profile_picture,
        "is_verified": user.is_verified,
        "created_at": user.created_at
    }

    # -----------------------------------------------------
    # 11. RETURN DASHBOARD
    # -----------------------------------------------------

    return {
        "user": user_data,

        "latest_resume": resume_data,

        "statistics": {
            "saved_jobs": saved_job_count,
            "total_applications": application_count,
            "applied": applied_count,
            "shortlisted": shortlisted_count,
            "rejected": rejected_count,
            "selected": selected_count
        },

        "recent_applications": recent_applications,

        "recent_saved_jobs": recent_saved_jobs
    }