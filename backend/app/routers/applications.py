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
from ..models import User, Job, Resume, Application
from ..utils.security import verify_access_token


router = APIRouter(
    prefix="/api/applications",
    tags=["Applications"]
)

security = HTTPBearer()


# =========================================================
# REQUEST MODEL
# =========================================================

class ApplicationStatusRequest(BaseModel):
    status: str


# =========================================================
# APPLY FOR JOB
# =========================================================

@router.post("/")
def apply_for_job(
    job_id: int,
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
        .filter(Job.job_id == job_id)
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    # -----------------------------------------------------
    # 5. GET LATEST RESUME
    # -----------------------------------------------------

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
        raise HTTPException(
            status_code=400,
            detail="Please upload a resume before applying."
        )

    # -----------------------------------------------------
    # 6. CHECK EXISTING APPLICATION
    # -----------------------------------------------------

    existing_application = (
        db.query(Application)
        .filter(
            Application.user_id == user_id,
            Application.job_id == job_id
        )
        .first()
    )

    if existing_application:

        return {
            "message": "You have already applied for this job.",
            "application_id": existing_application.application_id,
            "user_id": existing_application.user_id,
            "job_id": existing_application.job_id,
            "resume_id": existing_application.resume_id,
            "status": existing_application.status,
            "applied_at": existing_application.applied_at
        }

    # -----------------------------------------------------
    # 7. CREATE APPLICATION
    # -----------------------------------------------------

    new_application = Application(
        user_id=user_id,
        job_id=job_id,
        resume_id=resume.resume_id,
        status="APPLIED",
        applied_at=datetime.utcnow()
    )

    db.add(new_application)

    try:

        db.commit()
        db.refresh(new_application)

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

    # -----------------------------------------------------
    # 8. RETURN SUCCESS
    # -----------------------------------------------------

    return {
        "message": "Application submitted successfully",
        "application_id": new_application.application_id,
        "user_id": new_application.user_id,
        "job_id": new_application.job_id,
        "resume_id": new_application.resume_id,
        "status": new_application.status,
        "applied_at": new_application.applied_at
    }


# =========================================================
# GET MY APPLICATIONS
# =========================================================

@router.get("/")
def get_my_applications(
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
    # 4. GET APPLICATIONS
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

    # -----------------------------------------------------
    # 5. BUILD RESPONSE
    # -----------------------------------------------------

    application_list = []

    for application in applications:

        job = (
            db.query(Job)
            .filter(
                Job.job_id == application.job_id
            )
            .first()
        )

        if not job:
            continue

        application_list.append({
            "application_id": application.application_id,
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
            "resume_id": application.resume_id,
            "status": application.status,
            "applied_at": application.applied_at
        })

    # -----------------------------------------------------
    # 6. RETURN APPLICATIONS
    # -----------------------------------------------------

    return {
        "user_id": user_id,
        "applications": application_list,
        "count": len(application_list)
    }


# =========================================================
# GET SINGLE APPLICATION
# =========================================================

@router.get("/{application_id}")
def get_application(
    application_id: int,
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
    # 3. FIND APPLICATION
    # -----------------------------------------------------

    application = (
        db.query(Application)
        .filter(
            Application.application_id == application_id,
            Application.user_id == user_id
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    # -----------------------------------------------------
    # 4. GET JOB
    # -----------------------------------------------------

    job = (
        db.query(Job)
        .filter(
            Job.job_id == application.job_id
        )
        .first()
    )

    # -----------------------------------------------------
    # 5. RETURN APPLICATION
    # -----------------------------------------------------

    return {
        "application_id": application.application_id,
        "user_id": application.user_id,
        "job_id": application.job_id,
        "job_title": job.title if job else None,
        "company_id": job.company_id if job else None,
        "resume_id": application.resume_id,
        "status": application.status,
        "applied_at": application.applied_at
    }


# =========================================================
# UPDATE APPLICATION STATUS
# =========================================================

@router.put("/{application_id}/status")
def update_application_status(
    application_id: int,
    request: ApplicationStatusRequest,
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
    # 3. FIND APPLICATION
    # -----------------------------------------------------

    application = (
        db.query(Application)
        .filter(
            Application.application_id == application_id,
            Application.user_id == user_id
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    # -----------------------------------------------------
    # 4. VALIDATE STATUS
    # -----------------------------------------------------

    allowed_statuses = {
        "APPLIED",
        "SHORTLISTED",
        "REJECTED",
        "SELECTED"
    }

    new_status = request.status.upper()

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid application status. "
                "Allowed statuses are "
                "APPLIED, SHORTLISTED, REJECTED and SELECTED."
            )
        )

    # -----------------------------------------------------
    # 5. UPDATE STATUS
    # -----------------------------------------------------

    application.status = new_status

    try:

        db.commit()
        db.refresh(application)

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )
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
from ..models import User, Job, Resume, Application
from ..utils.security import verify_access_token


router = APIRouter(
    prefix="/api/applications",
    tags=["Applications"]
)

security = HTTPBearer()


# =========================================================
# REQUEST MODEL
# =========================================================

class ApplicationStatusRequest(BaseModel):
    status: str


# =========================================================
# APPLY FOR JOB
# =========================================================

@router.post("/")
def apply_for_job(
    job_id: int,
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
        .filter(Job.job_id == job_id)
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    # -----------------------------------------------------
    # 5. GET DEFAULT RESUME
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

    if not resume:
        raise HTTPException(
            status_code=400,
            detail=(
                "Please set a default resume before "
                "applying."
            )
        )

    # -----------------------------------------------------
    # 6. CHECK EXISTING APPLICATION
    # -----------------------------------------------------

    existing_application = (
        db.query(Application)
        .filter(
            Application.user_id == user_id,
            Application.job_id == job_id
        )
        .first()
    )

    if existing_application:

        return {
            "message": "You have already applied for this job.",
            "application_id": existing_application.application_id,
            "user_id": existing_application.user_id,
            "job_id": existing_application.job_id,
            "resume_id": existing_application.resume_id,
            "status": existing_application.status,
            "applied_at": existing_application.applied_at
        }

    # -----------------------------------------------------
    # 7. CREATE APPLICATION
    # -----------------------------------------------------

    new_application = Application(
        user_id=user_id,
        job_id=job_id,
        resume_id=resume.resume_id,
        status="APPLIED",
        applied_at=datetime.utcnow()
    )

    db.add(new_application)

    try:

        db.commit()
        db.refresh(new_application)

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

    # -----------------------------------------------------
    # 8. RETURN SUCCESS
    # -----------------------------------------------------

    return {
        "message": "Application submitted successfully",
        "application_id": new_application.application_id,
        "user_id": new_application.user_id,
        "job_id": new_application.job_id,
        "resume_id": new_application.resume_id,
        "status": new_application.status,
        "applied_at": new_application.applied_at
    }


# =========================================================
# GET MY APPLICATIONS
# =========================================================

@router.get("/")
def get_my_applications(
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
    # 4. GET APPLICATIONS
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

    # -----------------------------------------------------
    # 5. BUILD RESPONSE
    # -----------------------------------------------------

    application_list = []

    for application in applications:

        job = (
            db.query(Job)
            .filter(
                Job.job_id == application.job_id
            )
            .first()
        )

        if not job:
            continue

        application_list.append({
            "application_id": application.application_id,
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
            "resume_id": application.resume_id,
            "status": application.status,
            "applied_at": application.applied_at
        })

    # -----------------------------------------------------
    # 6. RETURN APPLICATIONS
    # -----------------------------------------------------

    return {
        "user_id": user_id,
        "applications": application_list,
        "count": len(application_list)
    }


# =========================================================
# GET SINGLE APPLICATION
# =========================================================

@router.get("/{application_id}")
def get_application(
    application_id: int,
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
    # 3. FIND APPLICATION
    # -----------------------------------------------------

    application = (
        db.query(Application)
        .filter(
            Application.application_id == application_id,
            Application.user_id == user_id
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    # -----------------------------------------------------
    # 4. GET JOB
    # -----------------------------------------------------

    job = (
        db.query(Job)
        .filter(
            Job.job_id == application.job_id
        )
        .first()
    )

    # -----------------------------------------------------
    # 5. RETURN APPLICATION
    # -----------------------------------------------------

    return {
        "application_id": application.application_id,
        "user_id": application.user_id,
        "job_id": application.job_id,
        "job_title": job.title if job else None,
        "company_id": job.company_id if job else None,
        "resume_id": application.resume_id,
        "status": application.status,
        "applied_at": application.applied_at
    }


# =========================================================
# UPDATE APPLICATION STATUS
# =========================================================

@router.put("/{application_id}/status")
def update_application_status(
    application_id: int,
    request: ApplicationStatusRequest,
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
    # 3. FIND APPLICATION
    # -----------------------------------------------------

    application = (
        db.query(Application)
        .filter(
            Application.application_id == application_id,
            Application.user_id == user_id
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    # -----------------------------------------------------
    # 4. VALIDATE STATUS
    # -----------------------------------------------------

    allowed_statuses = {
        "APPLIED",
        "SHORTLISTED",
        "REJECTED",
        "SELECTED"
    }

    new_status = request.status.upper()

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid application status. "
                "Allowed statuses are "
                "APPLIED, SHORTLISTED, REJECTED and SELECTED."
            )
        )

    # -----------------------------------------------------
    # 5. UPDATE STATUS
    # -----------------------------------------------------

    application.status = new_status

    try:

        db.commit()
        db.refresh(application)

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

    # -----------------------------------------------------
    # 6. RETURN SUCCESS
    # -----------------------------------------------------

    return {
        "message": "Application status updated successfully",
        "application_id": application.application_id,
        "user_id": application.user_id,
        "job_id": application.job_id,
        "resume_id": application.resume_id,
        "status": application.status,
        "applied_at": application.applied_at
    }
    # -----------------------------------------------------
    # 6. RETURN SUCCESS
    # -----------------------------------------------------

    return {
        "message": "Application status updated successfully",
        "application_id": application.application_id,
        "user_id": application.user_id,
        "job_id": application.job_id,
        "resume_id": application.resume_id,
        "status": application.status,
        "applied_at": application.applied_at
    }
