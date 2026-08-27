from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .models import Resume, User
from .schemas import ResumeCreate, ResumeResponse, ResumeUpdate
from .auth import get_current_user

router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"]
)


# CREATE RESUME
@router.post("/", response_model=ResumeResponse)
def create_resume(
    resume: ResumeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_resume = Resume(
        user_id=current_user.user_id,
        resume_name=resume.resume_name,
        file_path=resume.file_path,
        extracted_skills=resume.extracted_skills,
        is_default=resume.is_default
    )

    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)

    return new_resume


# GET ALL MY RESUMES
@router.get("/", response_model=list[ResumeResponse])
def get_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resumes = db.query(Resume).filter(
        Resume.user_id == current_user.user_id
    ).all()

    return resumes


# GET ONE MY RESUME
@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.resume_id == resume_id,
        Resume.user_id == current_user.user_id
    ).first()

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    return resume


# UPDATE MY RESUME
@router.put("/{resume_id}", response_model=ResumeResponse)
def update_resume(
    resume_id: int,
    resume_data: ResumeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.resume_id == resume_id,
        Resume.user_id == current_user.user_id
    ).first()

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    update_data = resume_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(resume, key, value)

    db.commit()
    db.refresh(resume)

    return resume


# DELETE MY RESUME
@router.delete("/{resume_id}")
def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.resume_id == resume_id,
        Resume.user_id == current_user.user_id
    ).first()

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    db.delete(resume)
    db.commit()

    return {
        "message": "Resume deleted successfully"
    }