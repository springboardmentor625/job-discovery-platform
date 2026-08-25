from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .models import Application, User, Job, Resume
from .schemas import ApplicationCreate, ApplicationResponse
from .auth import require_role


router = APIRouter(
    prefix="/applications",
    tags=["Applications"]
)


@router.post("/", response_model=ApplicationResponse)
def create_application(
    application: ApplicationCreate,
    current_user: User = Depends(require_role("candidate")),
    db: Session = Depends(get_db)
):
    # Check job exists
    job = db.query(Job).filter(
        Job.job_id == application.job_id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    # Check resume exists and belongs to current user
    resume = db.query(Resume).filter(
        Resume.resume_id == application.resume_id,
        Resume.user_id == current_user.user_id
    ).first()

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found or does not belong to you"
        )

    # Prevent duplicate application
    existing_application = db.query(Application).filter(
        Application.user_id == current_user.user_id,
        Application.job_id == application.job_id
    ).first()

    if existing_application:
        raise HTTPException(
            status_code=400,
            detail="You have already applied for this job"
        )

    new_application = Application(
        user_id=current_user.user_id,
        job_id=application.job_id,
        resume_id=application.resume_id,
        status="Applied"
    )

    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    return new_application

@router.get("/", response_model=list[ApplicationResponse])
def get_my_applications(
    current_user: User = Depends(require_role("candidate")),
    db: Session = Depends(get_db)
):
    applications = db.query(Application).filter(
        Application.user_id == current_user.user_id
    ).all()

    return applications

@router.get("/{application_id}", response_model=ApplicationResponse)
def get_my_application(
    application_id: int,
    current_user: User = Depends(require_role("candidate")),
    db: Session = Depends(get_db)
):
    application = db.query(Application).filter(
        Application.application_id == application_id,
        Application.user_id == current_user.user_id
    ).first()

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    return application

@router.get("/job/{job_id}", response_model=list[ApplicationResponse])
def get_job_applications(
    job_id: int,
    current_user: User = Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    # Check job exists
    job = db.query(Job).filter(
        Job.job_id == job_id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    applications = db.query(Application).filter(
        Application.job_id == job_id
    ).all()

    return applications

@router.put("/{application_id}/status", response_model=ApplicationResponse)
def update_application_status(
    application_id: int,
    status: str,
    current_user: User = Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    application = db.query(Application).filter(
        Application.application_id == application_id
    ).first()

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    allowed_statuses = {
        "Applied",
        "Shortlisted",
        "Rejected",
        "Selected"
    }

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid application status"
        )

    application.status = status

    db.commit()
    db.refresh(application)

    return application