from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Job


router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs"]
)


# =========================================================
# GET ALL ACTIVE JOBS
# =========================================================

@router.get("/")
def get_jobs(
    db: Session = Depends(get_db)
):
    """
    Return all active jobs.
    """

    jobs = (
        db.query(Job)
        .filter(Job.status == "ACTIVE")
        .order_by(Job.posted_date.desc())
        .all()
    )

    return [
        {
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
        }
        for job in jobs
    ]


# =========================================================
# GET JOB BY ID
# =========================================================

@router.get("/{job_id}")
def get_job(
    job_id: int,
    db: Session = Depends(get_db)
):
    """
    Return a single job by job ID.
    """

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

    return {
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
    }
