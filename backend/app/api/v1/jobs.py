from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any, List

from app.core.dependencies import get_db, get_current_active_user
from app.models.user import User, UserRole
from app.models.job import Job
from app.schemas.job import Job as JobSchema, JobCreate, JobUpdate, JobRecommendation
from app.schemas.job_match import MatchExplanationResponse, SkillGapResponse
from app.ai_services.recommendation_engine import get_job_recommendations
from app.ai_services.job_matching_service import get_match_explanation, analyze_skill_gap

router = APIRouter()

@router.post("/", response_model=JobSchema)
def create_job(
    *,
    db: Session = Depends(get_db),
    job_in: JobCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    if current_user.role != UserRole.recruiter and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Normally we'd look up the recruiter's company here
    # For now, let's assume they have one company
    company = current_user.companies[0] if current_user.companies else None
    if not company:
        raise HTTPException(status_code=400, detail="Recruiter must create a company first")
        
    job = Job(
        **job_in.model_dump(),
        recruiter_id=current_user.user_id,
        company_id=company.company_id
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

@router.get("/me", response_model=List[JobSchema])
def get_my_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    if current_user.role != UserRole.recruiter:
        raise HTTPException(status_code=403, detail="Only recruiters can view their posted jobs here")
        
    jobs = db.query(Job).filter(Job.recruiter_id == current_user.user_id).all()
    return jobs

@router.get("/", response_model=List[JobSchema])
def read_jobs(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    jobs = db.query(Job).offset(skip).limit(limit).all()
    return jobs

@router.get("/recommendations", response_model=List[JobRecommendation])
def get_recommendations(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    if current_user.role != UserRole.job_seeker:
        raise HTTPException(status_code=403, detail="Only job seekers get recommendations")
        
    return get_job_recommendations(db, current_user.user_id, skip=skip, limit=limit)

@router.get("/{job_id}/match-explanation", response_model=MatchExplanationResponse)
def get_match_explanation_endpoint(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    if current_user.role != UserRole.job_seeker:
        raise HTTPException(status_code=403, detail="Only job seekers can view match explanations")
    return get_match_explanation(db, current_user.user_id, job_id)

@router.get("/{job_id}/skill-gap", response_model=SkillGapResponse)
def get_skill_gap_endpoint(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    if current_user.role != UserRole.job_seeker:
        raise HTTPException(status_code=403, detail="Only job seekers can view skill gaps")
    return analyze_skill_gap(db, current_user.user_id, job_id)

@router.get("/{job_id}", response_model=JobSchema)
def read_job(
    *,
    db: Session = Depends(get_db),
    job_id: str,
) -> Any:
    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Increment views
    job.views_count += 1
    db.commit()
    db.refresh(job)
    return job

@router.delete("/{job_id}", response_model=dict)
def delete_job(
    *,
    db: Session = Depends(get_db),
    job_id: str,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    if current_user.role != UserRole.recruiter and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # Check ownership
    if current_user.role != UserRole.admin and job.recruiter_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="You can only delete your own jobs")
        
    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}
