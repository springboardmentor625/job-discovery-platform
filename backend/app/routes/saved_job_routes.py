from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SavedJob, Job
from ..auth import get_current_user
from .job_routes import invalidate_recommendation_cache


router = APIRouter(
    prefix="/api/saved-jobs",
    tags=["Saved Jobs"]
)


# ==========================================
# SAVE JOB
# ==========================================

@router.post("/{job_id}")
def save_job(
    job_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------------
    # Check job
    # --------------------------------------

    job = db.query(Job).filter(
        Job.job_id == job_id,
        Job.status == "active"
    ).first()

    if not job:

        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )


    # --------------------------------------
    # Check whether already saved
    # --------------------------------------

    existing_saved_job = db.query(
        SavedJob
    ).filter(
        SavedJob.user_id == user_id,
        SavedJob.job_id == job_id
    ).first()


    if existing_saved_job:

        return {

            "message": "Job already saved",

            "saved_job_id":
                existing_saved_job.saved_job_id,

            "job_id":
                existing_saved_job.job_id

        }


    # --------------------------------------
    # Create saved job
    # --------------------------------------

    saved_job = SavedJob(

        user_id=user_id,

        job_id=job_id

    )


    db.add(saved_job)

    db.commit()
    invalidate_recommendation_cache(user_id)

    db.refresh(saved_job)


    return {

        "message": "Job saved successfully",

        "saved_job_id":
            saved_job.saved_job_id,

        "job_id":
            saved_job.job_id

    }


# ==========================================
# GET MY SAVED JOBS
# ==========================================

@router.get("")
def get_saved_jobs(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    results = (

        db.query(
            SavedJob,
            Job
        )

        .join(
            Job,
            SavedJob.job_id == Job.job_id
        )

        .filter(
            SavedJob.user_id == user_id
        )

        .order_by(
            SavedJob.saved_at.desc()
        )

        .all()

    )


    return [

        {

            "saved_job_id":
                saved_job.saved_job_id,

            "job_id":
                job.job_id,

            "title":
                job.title,

            "company":
                job.company,

            "description":
                job.description,

            "location":
                job.location,

            "employment_type":
                job.employment_type,

            "experience_required":
                job.experience_required,

            "salary":
                job.salary,

            "skills":
                job.skills,

            "saved_at":
                saved_job.saved_at

        }

        for saved_job, job in results

    ]


# ==========================================
# REMOVE SAVED JOB
# ==========================================

@router.delete("/{job_id}")
def remove_saved_job(
    job_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    saved_job = db.query(
        SavedJob
    ).filter(
        SavedJob.user_id == user_id,
        SavedJob.job_id == job_id
    ).first()


    if not saved_job:

        raise HTTPException(
            status_code=404,
            detail="Saved job not found"
        )


    db.delete(saved_job)

    db.commit()
    invalidate_recommendation_cache(user_id)


    return {

        "message": "Job removed from saved jobs",

        "job_id": job_id

    }