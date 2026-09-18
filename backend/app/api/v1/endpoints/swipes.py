# app/api/v1/endpoints/swipes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import not_


from app.api.deps import get_db, get_current_user
from app.core.models import User, Job, Application, Resume, CandidateProfile
from app.core.schemas import SwipeAction, JobResponse
from app.services.ai.matcher import analyze_ats_match
from app.services.ml_recommender import rank_jobs_for_candidate

router = APIRouter()

@router.get("/queue", response_model=list[JobResponse])
async def get_job_queue(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Tinder-style feed ranked with TF-IDF cosine similarity for this candidate only."""
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can view the swipe queue")

    swiped_result = await db.execute(
        select(Application.job_id).where(Application.candidate_id == current_user.id)
    )
    swiped_job_ids = [row for row in swiped_result.scalars().all()]

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

    ranked = rank_jobs_for_candidate(profile=profile, jobs=jobs, resume=resume, top_k=25)
    return ranked

@router.post("/action")
async def process_swipe(
    action: SwipeAction, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """Executes the Strict ATS Workflow when a candidate swipes right, or records a pass for left."""
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can swipe")
    
    # 1. Fetch Job
    job_result = await db.execute(select(Job).where(Job.id == action.job_id))
    job = job_result.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Prevent Duplicate Swipes
    existing_app = await db.execute(
        select(Application).where(
            Application.candidate_id == current_user.id,
            Application.job_id == action.job_id
        )
    )
    if existing_app.scalars().first():
        raise HTTPException(status_code=400, detail="You have already swiped on this job.")

    profile_result = await db.execute(select(CandidateProfile).where(CandidateProfile.user_id == current_user.id))
    candidate_profile = profile_result.scalars().first()
    
    resume_result = await db.execute(select(Resume).where(Resume.candidate_id == current_user.id))
    resume = resume_result.scalars().first()

    ats_report_data = None
    
    # 2. Execute strict ATS Calculation for all swipes (Applied & Passed)
    # Generate job embedding if missing
    if job.embedding is None and job.description:
        try:
            from app.services.ai.embedder import vector_engine
            job.embedding = vector_engine.get_embedding(job.description)
        except Exception:
            pass

    # Generate resume embedding if missing
    if resume is not None and resume.embedding is None and resume.raw_text:
        try:
            from app.services.ai.embedder import vector_engine
            resume.embedding = vector_engine.get_embedding(resume.raw_text)
        except Exception:
            pass

    c_skills = candidate_profile.skills if (candidate_profile and candidate_profile.skills) else []
    j_skills = job.required_skills if job.required_skills else []
    c_vector = resume.embedding if (resume and resume.embedding is not None) else None
    j_vector = job.embedding if (job and job.embedding is not None) else None

    ats_report_data = analyze_ats_match(
        candidate_skills=c_skills,
        job_skills=j_skills,
        candidate_vector=c_vector,
        job_vector=j_vector
    )
    if action.direction == "left":
        ats_report_data["status"] = "passed"

    # 3. Store Application (Logs both 'right' and 'left' actions)
    application = Application(
        candidate_id=current_user.id,
        job_id=job.id,
        swipe_direction=action.direction,
        recruiter_status="pending" if action.direction == "right" else "passed",
        ats_report=ats_report_data
    )
    
    db.add(application)
    await db.commit()
    
    return {
        "success": True, 
        "direction": action.direction, 
        "ats_report": ats_report_data
    }


@router.get("/history")
async def get_swipe_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can view swipe history")

    result = await db.execute(
        select(Application, Job)
        .join(Job, Application.job_id == Job.id)
        .where(
            Application.candidate_id == current_user.id,
        )
        .order_by(Application.created_at.desc())
    )
    history = []
    for app, job in result.all():
        ats = app.ats_report or {}
        history.append({
            "id": str(app.id),
            "swipe_direction": app.swipe_direction,
            "status": app.recruiter_status,
            "ats_score": ats.get("ats_score"),
            "ats_report": app.ats_report,
            "created_at": app.created_at.isoformat() if (hasattr(app, "created_at") and app.created_at) else None,
            "job": {
                "id": str(job.id),
                "title": job.title,
                "company_name": job.company_name,
                "location": job.location,
                "description": job.description,
                "required_skills": job.required_skills or [],
            },
        })
    return history
