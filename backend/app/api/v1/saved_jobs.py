from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any, List

from app.core.dependencies import get_db, get_current_active_user
from app.models.user import User, UserRole
from app.models.job import Job
from app.models.saved_job import SavedJob
from app.schemas.saved_job import SavedJob as SavedJobSchema, SavedJobCreate

router = APIRouter()

@router.post("/", response_model=SavedJobSchema)
def create_saved_job(
    *,
    db: Session = Depends(get_db),
    saved_in: SavedJobCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    if current_user.role != UserRole.job_seeker:
        raise HTTPException(status_code=403, detail="Only job seekers can save jobs")
        
    job = db.query(Job).filter(Job.job_id == saved_in.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = db.query(SavedJob).filter(
        SavedJob.user_id == current_user.user_id,
        SavedJob.job_id == saved_in.job_id
    ).first()
    if existing:
        return existing
        
    saved_job = SavedJob(
        user_id=current_user.user_id,
        job_id=saved_in.job_id
    )
    db.add(saved_job)
    db.commit()
    db.refresh(saved_job)
    return saved_job

@router.get("/", response_model=List[SavedJobSchema])
def get_saved_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    saved_jobs = db.query(SavedJob).filter(SavedJob.user_id == current_user.user_id).all()
    return saved_jobs

@router.delete("/{job_id}", response_model=dict)
def remove_saved_job(
    *,
    db: Session = Depends(get_db),
    job_id: str,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    saved_job = db.query(SavedJob).filter(
        SavedJob.user_id == current_user.user_id,
        SavedJob.job_id == job_id
    ).first()
    
    if not saved_job:
        raise HTTPException(status_code=404, detail="Saved job not found")
        
    db.delete(saved_job)
    db.commit()
    return {"status": "success", "message": "Job unsaved"}
