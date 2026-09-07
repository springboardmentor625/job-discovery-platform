
from datetime import datetime

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
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    User,
    Job,
    Resume,
    SwipeHistory,
    Application,
)
from ..utils.security import verify_access_token


router = APIRouter(
    prefix="/api/swipes",
    tags=["Swipes"]
)

security = HTTPBearer()


# =========================================================
# REQUEST MODEL
# =========================================================

class SwipeRequest(BaseModel):
    job_id: int
    swipe_action: str


# =========================================================
# CREATE SWIPE
# =========================================================

@router.post("/")
def create_swipe(
    request: SwipeRequest,
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
    # 3. CHECK USER
    # -----------------------------------------------------

    user = (
        db.query(User)
        .filter(User.user_id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # -----------------------------------------------------
    # 4. CHECK JOB
    # -----------------------------------------------------

    job = (
        db.query(Job)
        .filter(Job.job_id == request.job_id)
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    # -----------------------------------------------------
    # 5. VALIDATE SWIPE ACTION
    # -----------------------------------------------------

    allowed_actions = {
        "LEFT",
        "RIGHT",
        "SAVE"
    }

    swipe_action = request.swipe_action.upper()

    if swipe_action not in allowed_actions:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid swipe action. "
                "Allowed actions are LEFT, RIGHT and SAVE."
            )
        )

    # =====================================================
    # 6. SAVE ACTION - PREVENT DUPLICATE SAVES
    # =====================================================

    if swipe_action == "SAVE":

        existing_save = (
            db.query(SwipeHistory)
            .filter(
                SwipeHistory.user_id == user_id,
                SwipeHistory.job_id == request.job_id,
                SwipeHistory.swipe_action == "SAVE"
            )
            .order_by(
                SwipeHistory.swiped_at.desc()
            )
            .first()
        )

        # -------------------------------------------------
        # JOB ALREADY SAVED
        # -------------------------------------------------

        if existing_save:

            return {
                "message": "Job is already saved.",
                "swipe_id": existing_save.swipe_id,
                "user_id": user_id,
                "job_id": request.job_id,
                "swipe_action": "SAVE",
                "swiped_at": existing_save.swiped_at
            }

    # =====================================================
    # 7. CREATE SWIPE HISTORY
    # =====================================================

    swipe = SwipeHistory(
        user_id=user_id,
        job_id=request.job_id,
        swipe_action=swipe_action,
        swiped_at=datetime.utcnow()
    )

    db.add(swipe)

    try:

        db.flush()

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Database error while saving swipe: "
                f"{str(e)}"
            )
        )

    # =====================================================
    # 8. RIGHT SWIPE → CREATE APPLICATION
    # =====================================================

    application = None

    if swipe_action == "RIGHT":

        # -------------------------------------------------
        # GET LATEST RESUME
        # -------------------------------------------------

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

        if not resume:

            db.rollback()

            raise HTTPException(
                status_code=400,
                detail=(
                    "Please upload a resume before "
                    "applying for a job."
                )
            )

        # -------------------------------------------------
        # CHECK EXISTING APPLICATION
        # -------------------------------------------------

        existing_application = (
            db.query(Application)
            .filter(
                Application.user_id == user_id,
                Application.job_id == request.job_id
            )
            .first()
        )

        # -------------------------------------------------
        # APPLICATION ALREADY EXISTS
        # -------------------------------------------------

        if existing_application:

            try:

                db.commit()

                db.refresh(swipe)

            except Exception as e:

                db.rollback()

                raise HTTPException(
                    status_code=500,
                    detail=f"Database error: {str(e)}"
                )

            return {
                "message": (
                    "Job swipe recorded. "
                    "You have already applied for this job."
                ),
                "swipe_id": swipe.swipe_id,
                "user_id": user_id,
                "job_id": request.job_id,
                "swipe_action": swipe_action,
                "application_id": (
                    existing_application.application_id
                ),
                "application_status": (
                    existing_application.status
                ),
                "resume_id": (
                    existing_application.resume_id
                ),
                "swiped_at": swipe.swiped_at
            }

        # -------------------------------------------------
        # CREATE APPLICATION
        # -------------------------------------------------

        application = Application(
            user_id=user_id,
            job_id=request.job_id,
            resume_id=resume.resume_id,
            status="APPLIED",
            applied_at=datetime.utcnow()
        )

        db.add(application)

    # =====================================================
    # 9. COMMIT EVERYTHING
    # =====================================================

    try:

        db.commit()

        db.refresh(swipe)

        if application:
            db.refresh(application)

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

    # =====================================================
    # 10. RESPONSE FOR RIGHT
    # =====================================================

    if swipe_action == "RIGHT":

        return {
            "message": (
                "Job marked for application "
                "and application submitted successfully."
            ),
            "swipe_id": swipe.swipe_id,
            "user_id": user_id,
            "job_id": request.job_id,
            "swipe_action": swipe_action,
            "application_id": application.application_id,
            "resume_id": application.resume_id,
            "application_status": application.status,
            "swiped_at": swipe.swiped_at,
            "applied_at": application.applied_at
        }

    # =====================================================
    # 11. RESPONSE FOR LEFT
    # =====================================================

    if swipe_action == "LEFT":

        return {
            "message": "Job skipped successfully.",
            "swipe_id": swipe.swipe_id,
            "user_id": user_id,
            "job_id": request.job_id,
            "swipe_action": swipe_action,
            "swiped_at": swipe.swiped_at
        }

    # =====================================================
    # 12. RESPONSE FOR SAVE
    # =====================================================

    return {
        "message": "Job saved successfully.",
        "swipe_id": swipe.swipe_id,
        "user_id": user_id,
        "job_id": request.job_id,
        "swipe_action": swipe_action,
        "swiped_at": swipe.swiped_at
    }


# =========================================================
# GET SAVED JOBS
# =========================================================

@router.get("/saved")
def get_saved_jobs(
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
    # 3. CHECK USER
    # -----------------------------------------------------

    user = (
        db.query(User)
        .filter(User.user_id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # -----------------------------------------------------
    # 4. GET SAVED SWIPES
    # -----------------------------------------------------

    saved_swipes = (
        db.query(SwipeHistory)
        .filter(
            SwipeHistory.user_id == user_id,
            SwipeHistory.swipe_action == "SAVE"
        )
        .order_by(
            SwipeHistory.swiped_at.desc()
        )
        .all()
    )

    # -----------------------------------------------------
    # 5. BUILD RESPONSE
    # -----------------------------------------------------

    saved_jobs = []

    for swipe in saved_swipes:

        job = (
            db.query(Job)
            .filter(
                Job.job_id == swipe.job_id
            )
            .first()
        )

        if not job:
            continue

        saved_jobs.append({
            "swipe_id": swipe.swipe_id,
            "job_id": job.job_id,
            "company_id": job.company_id,
            "title": job.title,
            "description": job.description,
            "location": job.location,
            "employment_type": job.employment_type,
            "salary_min": job.salary_min,
            "salary_max": job.salary_max,
            "experience_required": job.experience_required,
            "required_skills": job.required_skills,
            "posted_date": job.posted_date,
            "status": job.status,
            "saved_at": swipe.swiped_at
        })

    # -----------------------------------------------------
    # 6. RETURN SAVED JOBS
    # -----------------------------------------------------

    return {
        "user_id": user_id,
        "saved_jobs": saved_jobs,
        "count": len(saved_jobs)
    }

