from fastapi import (
    APIRouter,
    Depends
)

from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Job, JobSwipe
from ..auth import get_current_user


router = APIRouter(
    prefix="/api/matches",
    tags=["Matches"]
)


# ==========================================
# GET CANDIDATE MATCHES
# ==========================================

@router.get("")
def get_matches(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # ======================================
    # GET LIKED JOBS
    # ======================================

    liked_swipes = db.query(
        JobSwipe
    ).filter(
        JobSwipe.user_id == user_id,
        JobSwipe.action == "like"
    ).order_by(
        JobSwipe.created_at.desc()
    ).all()


    matches = []


    # ======================================
    # GET JOB DETAILS
    # ======================================

    for swipe in liked_swipes:

        job = db.query(Job).filter(
            Job.job_id == swipe.job_id
        ).first()


        # Job may have been removed/deactivated
        if not job:
            continue


        matches.append({

            "match_id":
                swipe.swipe_id,

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

            "matched_at":
                swipe.created_at

        })


    return matches