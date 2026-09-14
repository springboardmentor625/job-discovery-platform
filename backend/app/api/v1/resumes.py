from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Any, List
import shutil
import os

from app.core.dependencies import get_db, get_current_active_user
from app.models.user import User, UserRole
from app.models.resume import Resume
from app.schemas.resume import Resume as ResumeSchema, ResumeAnalysis
from app.ai_services.resume_parser import analyze_resume_mock

router = APIRouter()

UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=ResumeSchema)
def upload_resume(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    if current_user.role != UserRole.job_seeker:
        raise HTTPException(status_code=403, detail="Only job seekers can upload resumes")
        
    file_path = os.path.join(UPLOAD_DIR, f"{current_user.user_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_size = os.path.getsize(file_path)
    
    resume = Resume(
        user_id=current_user.user_id,
        title=title,
        file_path=file_path,
        file_type=file.content_type,
        file_size=file_size,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume

@router.get("/", response_model=List[ResumeSchema])
def get_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    return db.query(Resume).filter(Resume.user_id == current_user.user_id).all()

@router.post("/{resume_id}/analyze", response_model=ResumeAnalysis)
def analyze_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    resume = db.query(Resume).filter(Resume.resume_id == resume_id).first()
    if not resume or resume.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    # Call mock AI service
    analysis = analyze_resume_mock(resume.file_path)
    
    # Update resume in DB
    resume.ats_score = analysis["ats_score"]
    resume.extracted_skills = analysis["extracted_skills"]
    resume.missing_keywords = analysis["missing_keywords"]
    db.commit()
    
    return analysis

@router.delete("/{resume_id}")
def delete_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    resume = db.query(Resume).filter(Resume.resume_id == resume_id).first()
    if not resume or resume.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    # Optional: Delete file from disk
    if os.path.exists(resume.file_path):
        try:
            os.remove(resume.file_path)
        except OSError:
            pass
            
    db.delete(resume)
    db.commit()
    return {"message": "Resume deleted successfully"}
