# app/api/v1/endpoints/recruiters.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
import uuid

from app.api.deps import get_db, get_current_user
from app.core.models import User, Job, Application, CandidateProfile
from app.core.schemas import JobCreate, JobResponse
from app.services.ai.embedder import vector_engine

router = APIRouter()

# Schema for recruiter decision
class DecisionUpdate(BaseModel):
    application_id: uuid.UUID
    status: str # "interviewing" or "rejected"

@router.post("/jobs", response_model=JobResponse)
async def create_job(job_in: JobCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can post jobs")
        
    embedding = None
    try:
        embedding = vector_engine.get_embedding(job_in.description)
    except Exception:
        embedding = None

    new_job = Job(
        recruiter_id=current_user.id,
        title=job_in.title,
        company_name=job_in.company_name,
        location=job_in.location,
        description=job_in.description,
        required_skills=job_in.required_skills or [],
        embedding=embedding,
    )
    
    db.add(new_job)
    await db.commit()
    await db.refresh(new_job)
    return new_job

@router.get("/feed")
async def get_candidate_feed(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Returns candidates who applied to the recruiter's jobs, sorted by highest ATS Score."""
    if current_user.role != "recruiter":
        raise HTTPException(status_code=403, detail="Access denied")

    query = (
        select(Application, CandidateProfile, Job)
        .join(Job, Application.job_id == Job.id)
        .join(CandidateProfile, Application.candidate_id == CandidateProfile.user_id)
        .where(
            Job.recruiter_id == current_user.id,
            Application.swipe_direction == "right",
        )
        .order_by(Application.created_at.desc())
    )
    
    result = await db.execute(query)
    records = result.all()
    
    feed = []
    for app, profile, job in records:
        ats = app.ats_report or {}
        score = ats.get("ats_score")
        feed.append({
            "application_id": app.id,
            "job_id": job.id,
            "candidate_name": profile.full_name or "Applicant",
            "job_title": job.title,
            "ats_report": app.ats_report,
            "ats_score": score,
            "skills": profile.skills or [],
            "profile_health_score": profile.profile_health_score,
            "status": app.recruiter_status,
        })
    feed.sort(key=lambda x: (x["ats_score"] is not None, x["ats_score"] or 0), reverse=True)
    return feed

@router.put("/decision")
async def update_candidate_status(
    decision: DecisionUpdate, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """Updates candidate status (e.g., to 'interviewing') so it reflects on their dashboard."""
    result = await db.execute(select(Application).where(Application.id == decision.application_id))
    app = result.scalars().first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    app.recruiter_status = decision.status
    await db.commit()
    return {"success": True, "new_status": decision.status}