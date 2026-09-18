from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import not_
from typing import List

from app.api.deps import get_db, get_current_user
from app.core.models import Job, User, Application, CandidateProfile, Resume
from app.core.schemas import JobResponse, JobCreate
from app.services.ml_recommender import rank_jobs_for_candidate

router = APIRouter()


@router.get("/", response_model=List[JobResponse])
async def get_recommended_jobs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Rank active jobs for this candidate with strong hybrid ML. Exclude already-swiped jobs."""
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can view the recommended job feed")

    swiped_result = await db.execute(
        select(Application.job_id).where(Application.candidate_id == current_user.id)
    )
    swiped_job_ids = list(swiped_result.scalars().all())

    filters = [Job.is_active == True]
    if swiped_job_ids:
        filters.append(not_(Job.id.in_(swiped_job_ids)))

    jobs_result = await db.execute(select(Job).where(*filters))
    jobs = jobs_result.scalars().all()

    profile_result = await db.execute(
        select(CandidateProfile).where(CandidateProfile.user_id == current_user.id)
    )
    profile = profile_result.scalars().first()

    resume_result = await db.execute(
        select(Resume).where(Resume.candidate_id == current_user.id)
    )
    resume = resume_result.scalars().first()

    return rank_jobs_for_candidate(profile=profile, jobs=jobs, resume=resume, top_k=25)


@router.get("/me", response_model=List[JobResponse])
async def get_my_jobs(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can view posted jobs")
    result = await db.execute(select(Job).where(Job.recruiter_id == current_user.id))
    return result.scalars().all()


@router.post("/", response_model=JobResponse)
async def create_job(
    job_in: JobCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can post jobs")

    db_job = Job(
        title=job_in.title,
        company_name=job_in.company_name,
        location=job_in.location,
        description=job_in.description,
        required_skills=job_in.required_skills or [],
        recruiter_id=current_user.id,
        embedding=None,
        is_active=True,
    )
    db.add(db_job)
    await db.commit()
    await db.refresh(db_job)
    return db_job
