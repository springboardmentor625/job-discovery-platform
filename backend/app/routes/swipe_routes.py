from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from pydantic import BaseModel

from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Job, JobSwipe
from ..auth import get_current_user


router = APIRouter(
    prefix="/api/jobs",
    tags=["Job Swipes"]
)


# ==========================================
# SWIPE REQUEST
# ==========================================

class SwipeRequest(BaseModel):

    action: str


# ==========================================
# LIKE / REJECT JOB
# ==========================================

@router.post("/{job_id}/swipe")
def swipe_job(
    job_id: int,
    data: SwipeRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # ======================================
    # VALIDATE ACTION
    # ======================================

    if data.action not in [
        "like",
        "reject"
    ]:

        raise HTTPException(
            status_code=400,
            detail="Action must be either like or reject"
        )


    # ======================================
    # CHECK JOB
    # ======================================

    job = db.query(Job).filter(
        Job.job_id == job_id,
        Job.status == "active"
    ).first()


    if not job:

        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )


    # ======================================
    # CHECK EXISTING SWIPE
    # ======================================

    existing_swipe = db.query(
        JobSwipe
    ).filter(
        JobSwipe.user_id == user_id,
        JobSwipe.job_id == job_id
    ).first()


    # ======================================
    # UPDATE EXISTING SWIPE
    # ======================================

    if existing_swipe:

        existing_swipe.action = data.action

        db.commit()

        db.refresh(existing_swipe)

        return {

            "message": "Swipe updated successfully",

            "swipe_id":
                existing_swipe.swipe_id,

            "job_id":
                existing_swipe.job_id,

            "action":
                existing_swipe.action

        }


    # ======================================
    # CREATE NEW SWIPE
    # ======================================

    swipe = JobSwipe(

        user_id=user_id,

        job_id=job_id,

        action=data.action

    )


    db.add(swipe)

    db.commit()

    db.refresh(swipe)


    return {

        "message": "Swipe saved successfully",

        "swipe_id":
            swipe.swipe_id,

        "job_id":
            swipe.job_id,

        "action":
            swipe.action

    }