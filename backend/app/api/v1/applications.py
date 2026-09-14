from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any, List

from app.core.dependencies import get_db, get_current_active_user
from app.models.user import User, UserRole
from app.models.application import Application
from app.models.job import Job
from app.schemas.application import Application as ApplicationSchema, ApplicationCreate, ApplicationUpdate, ApplicationWithDetails

router = APIRouter()

@router.post("/", response_model=ApplicationSchema)
def create_application(
    *,
    db: Session = Depends(get_db),
    app_in: ApplicationCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    if current_user.role != UserRole.job_seeker:
        raise HTTPException(status_code=403, detail="Only job seekers can apply")
        
    job = db.query(Job).filter(Job.job_id == app_in.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = db.query(Application).filter(
        Application.user_id == current_user.user_id,
        Application.job_id == app_in.job_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already applied to this job")
        
    application = Application(
        **app_in.model_dump(),
        user_id=current_user.user_id
    )
    db.add(application)
    
    # Increment applicant count
    job.applicant_count += 1
    
    db.commit()
    db.refresh(application)
    return application

@router.get("/", response_model=List[ApplicationWithDetails])
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    # If job seeker, return their applications
    if current_user.role == UserRole.job_seeker:
        apps = db.query(Application).filter(Application.user_id == current_user.user_id).all()
        return apps
    
    # If recruiter, return applications for their jobs
    if current_user.role == UserRole.recruiter:
        company = current_user.companies[0] if current_user.companies else None
        if not company:
            return []
        apps = db.query(Application).join(Job).filter(Job.company_id == company.company_id).all()
        return apps
        
    return []

@router.put("/{app_id}/status", response_model=ApplicationSchema)
def update_application_status(
    *,
    db: Session = Depends(get_db),
    app_id: str,
    status_update: ApplicationUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    if current_user.role != UserRole.recruiter and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    application = db.query(Application).filter(Application.application_id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
        
    application.status = status_update.status
    db.commit()
    db.refresh(application)
    
    # Trigger notification here
    
    return application
