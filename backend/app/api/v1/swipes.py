from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any, List

from app.core.dependencies import get_db, get_current_active_user
from app.models.user import User, UserRole
from app.models.swipe import Swipe
from app.models.job import Job
from app.schemas.swipe import Swipe as SwipeSchema, SwipeCreate

router = APIRouter()

@router.post("/", response_model=SwipeSchema)
def create_swipe(
    *,
    db: Session = Depends(get_db),
    swipe_in: SwipeCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    if current_user.role != UserRole.job_seeker:
        raise HTTPException(status_code=403, detail="Only job seekers can swipe")
        
    job = db.query(Job).filter(Job.job_id == swipe_in.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check if already swiped
    existing = db.query(Swipe).filter(
        Swipe.user_id == current_user.user_id,
        Swipe.job_id == swipe_in.job_id
    ).first()
    if existing:
        return existing
        
    swipe = Swipe(
        user_id=current_user.user_id,
        job_id=swipe_in.job_id,
        swipe_type=swipe_in.swipe_type
    )
    db.add(swipe)
    db.commit()
    db.refresh(swipe)
    
    # Trigger recommendation learning here in a background task
    
    return swipe

@router.get("/history", response_model=List[SwipeSchema])
def get_swipe_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    swipes = db.query(Swipe).filter(Swipe.user_id == current_user.user_id).all()
    return swipes
