from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Job, JobSwipe
from ..auth import get_current_user


router = APIRouter(
    prefix="/api/candidate",
    tags=["Job Discovery"]
)


# ==========================================
# GET JOBS FOR CANDIDATE
# ==========================================

@router.get("/jobs")
def get_candidate_jobs(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Get job IDs already swiped by this candidate

    swiped_job_ids = db.query(
        JobSwipe.job_id
    ).filter(
        JobSwipe.user_id == user_id
    ).all()

    swiped_job_ids = [
        job_id
        for (job_id,) in swiped_job_ids
    ]


    # Get active jobs that candidate
    # has not swiped on yet

    query = db.query(Job).filter(
        Job.status == "active"
    )

    if swiped_job_ids:

        query = query.filter(
            ~Job.job_id.in_(swiped_job_ids)
        )


    jobs = query.order_by(
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
# SWIPE JOB
# ==========================================

@router.post("/jobs/{job_id}/swipe")
def swipe_job(
    job_id: int,
    action: str,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------------
    # Validate action
    # --------------------------------------

    if action not in ["liked", "rejected"]:

        raise HTTPException(
            status_code=400,
            detail="Action must be 'liked' or 'rejected'"
        )


    # --------------------------------------
    # Check job exists
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
    # Check whether already swiped
    # --------------------------------------

    existing_swipe = db.query(
        JobSwipe
    ).filter(
        JobSwipe.user_id == user_id,
        JobSwipe.job_id == job_id
    ).first()


    if existing_swipe:

        raise HTTPException(
            status_code=400,
            detail="You have already swiped on this job"
        )


    # --------------------------------------
    # Save swipe
    # --------------------------------------

    swipe = JobSwipe(

        user_id=user_id,

        job_id=job_id,

        action=action

    )


    db.add(swipe)

    db.commit()

    db.refresh(swipe)


    # --------------------------------------
    # Response
    # --------------------------------------

    return {

        "message": "Job swipe saved successfully",

        "swipe_id": swipe.swipe_id,

        "job_id": job_id,

        "action": action

    }