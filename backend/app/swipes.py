from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .models import SwipeHistory, Job, User
from .auth import get_current_user


router = APIRouter(
    prefix="/swipes",
    tags=["Swipe History"]
)


@router.post("/{job_id}")
def record_swipe(
    job_id: int,
    swipe_action: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check job exists
    job = db.query(Job).filter(
        Job.job_id == job_id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    # Validate swipe action
    allowed_actions = {
        "Pass",
        "Interested"
    }

    if swipe_action not in allowed_actions:
        raise HTTPException(
            status_code=400,
            detail="Invalid swipe action. Use Pass or Interested."
        )

    # Check whether user already swiped this job
    existing_swipe = db.query(SwipeHistory).filter(
        SwipeHistory.user_id == current_user.user_id,
        SwipeHistory.job_id == job_id
    ).first()

    if existing_swipe:
        # Update previous swipe
        existing_swipe.swipe_action = swipe_action

        db.commit()
        db.refresh(existing_swipe)

        return {
            "message": "Swipe updated successfully",
            "swipe": existing_swipe
        }

    # Create new swipe
    new_swipe = SwipeHistory(
        user_id=current_user.user_id,
        job_id=job_id,
        swipe_action=swipe_action
    )

    db.add(new_swipe)
    db.commit()
    db.refresh(new_swipe)

    return {
        "message": "Swipe recorded successfully",
        "swipe": new_swipe
    }

@router.get("/interested")
def get_interested_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interested_jobs = (
        db.query(Job)
        .join(
            SwipeHistory,
            SwipeHistory.job_id == Job.job_id
        )
        .filter(
            SwipeHistory.user_id == current_user.user_id,
            SwipeHistory.swipe_action == "Interested"
        )
        .all()
    )

    return interested_jobs
