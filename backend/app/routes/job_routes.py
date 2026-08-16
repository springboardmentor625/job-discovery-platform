from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Job
from ..auth import get_current_user


router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs"]
)


# ==========================================
# CREATE JOB
# ==========================================

@router.post("")
def create_job(
    title: str,
    company: str,
    description: str,
    location: str,
    employment_type: str,
    experience_required: str = None,
    salary: str = None,
    skills: str = None,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    job = Job(

        recruiter_id=user_id,

        title=title,

        company=company,

        description=description,

        location=location,

        employment_type=employment_type,

        experience_required=experience_required,

        salary=salary,

        skills=skills,

        status="active"
    )

    db.add(job)

    db.commit()

    db.refresh(job)

    return {

        "message": "Job created successfully",

        "job_id": job.job_id

    }


# ==========================================
# GET ACTIVE JOBS
# ==========================================

@router.get("")
def get_jobs(
    db: Session = Depends(get_db)
):

    jobs = db.query(Job).filter(
        Job.status == "active"
    ).order_by(
        Job.created_at.desc()
    ).all()

    return [

        {
            "job_id": job.job_id,

            "title": job.title,

            "company": job.company,

            "description": job.description,

            "location": job.location,

            "employment_type":
                job.employment_type,

            "experience_required":
                job.experience_required,

            "salary":
                job.salary,

            "skills":
                job.skills,

            "created_at":
                job.created_at
        }

        for job in jobs

    ]


# ==========================================
# GET SINGLE JOB
# ==========================================

@router.get("/{job_id}")
def get_job(
    job_id: int,
    db: Session = Depends(get_db)
):

    job = db.query(Job).filter(
        Job.job_id == job_id,
        Job.status == "active"
    ).first()

    if not job:

        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    return {

        "job_id": job.job_id,

        "title": job.title,

        "company": job.company,

        "description": job.description,

        "location": job.location,

        "employment_type":
            job.employment_type,

        "experience_required":
            job.experience_required,

        "salary":
            job.salary,

        "skills":
            job.skills,

        "created_at":
            job.created_at
    }