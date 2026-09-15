from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from .database import get_db
from .models import SwipeHistory, Job, User, Company
from .schemas import SwipeHistoryResponse
from .auth import get_current_user


router = APIRouter(
    prefix="/swipes",
    tags=["Swipe History"]
)


def prune_swipe_history(user_id: int, db: Session, max_limit: int = 50):
    """
    Database-enforced limit: retain only the latest 50 swipe records per candidate.
    When record count exceeds 50,the oldest records are automatically deleted.
    """
    all_swipes = (
        db.query(SwipeHistory.swipe_id)
        .filter(SwipeHistory.user_id == user_id)
        .order_by(SwipeHistory.swiped_at.desc(), SwipeHistory.swipe_id.desc())
        .all()
    )

    if len(all_swipes) > max_limit:
        excess_ids = [s.swipe_id for s in all_swipes[max_limit:]]
        if excess_ids:
            db.query(SwipeHistory).filter(
                SwipeHistory.swipe_id.in_(excess_ids)
            ).delete(synchronize_session=False)
            db.commit()


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
        # Update previous swipe and move to top/latest timestamp
        existing_swipe.swipe_action = swipe_action
        existing_swipe.swiped_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(existing_swipe)

        # Enforce 50-record limit
        prune_swipe_history(current_user.user_id, db, 50)

        return {
            "message": "Swipe updated successfully",
            "swipe": existing_swipe
        }

    # Create new swipe
    new_swipe = SwipeHistory(
        user_id=current_user.user_id,
        job_id=job_id,
        swipe_action=swipe_action,
        swiped_at=datetime.now(timezone.utc)
    )

    db.add(new_swipe)
    db.commit()
    db.refresh(new_swipe)

    # Enforce 50-record limit
    prune_swipe_history(current_user.user_id, db, 50)

    return {
        "message": "Swipe recorded successfully",
        "swipe": new_swipe
    }


@router.get("/history", response_model=list[SwipeHistoryResponse])
@router.get("/swipe-history", response_model=list[SwipeHistoryResponse])
def get_swipe_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns only the authenticated candidate's own latest 50 swipe records, newest first.
    """
    # Enforce limit check
    prune_swipe_history(current_user.user_id, db, 50)

    rows = (
        db.query(
            SwipeHistory.swipe_id,
            SwipeHistory.user_id,
            SwipeHistory.job_id,
            SwipeHistory.swipe_action,
            SwipeHistory.swiped_at,
            Job.title.label("job_title"),
            Job.location.label("location"),
            Job.employment_type.label("employment_type"),
            Job.salary_min.label("salary_min"),
            Job.salary_max.label("salary_max"),
            Company.company_name.label("company_name"),
            Company.company_id.label("company_id")
        )
        .join(Job, SwipeHistory.job_id == Job.job_id)
        .outerjoin(Company, Job.company_id == Company.company_id)
        .filter(SwipeHistory.user_id == current_user.user_id)
        .order_by(SwipeHistory.swiped_at.desc(), SwipeHistory.swipe_id.desc())
        .limit(50)
        .all()
    )

    history = []
    for r in rows:
        history.append({
            "swipe_id": r.swipe_id,
            "user_id": r.user_id,
            "job_id": r.job_id,
            "swipe_action": r.swipe_action,
            "swiped_at": r.swiped_at,
            "job_title": r.job_title or f"Job #{r.job_id}",
            "company_name": r.company_name or "Tech Company",
            "company_id": r.company_id,
            "location": r.location or "Remote",
            "employment_type": r.employment_type or "Full-time",
            "salary_min": r.salary_min,
            "salary_max": r.salary_max
        })

    return history


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

