import random
import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import not_
from app.database import get_db
from app.routers.auth import get_current_user
from app.models import User, Job, SwipeHistory, Resume, ATSReport, Application, CandidateProfile
from app.schemas import JobOut, SwipeActionRequest, SwipeActionResponse, ResumeOut, ATSReportOut, SavedJobOut
from app.services.nlp_parser import parse_resume, extract_text_from_pdf
from app.services.job_matcher import get_matched_jobs
router = APIRouter(prefix="/candidate", tags=["candidate"])
UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)
def sync_profile_from_resume(db: Session, user_id: int, parsed_data: dict) -> CandidateProfile:
    """
    Reusable function that syncs the CandidateProfile with data extracted
    from a resume. Called every time a resume is uploaded or replaced.
    Overwrites skills, projects, and certifications with the latest parsed values.
    """
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    if not profile:
        profile = CandidateProfile(user_id=user_id)
        db.add(profile)
        db.flush()
    extracted_skills = parsed_data.get("skills", [])
    extracted_projects = parsed_data.get("projects", "")
    extracted_certs = parsed_data.get("certifications", [])
    extracted_education = parsed_data.get("education", "")
    extracted_experience = parsed_data.get("experience_summary", "")
    profile.skills = ", ".join(extracted_skills) if extracted_skills else ""
    profile.projects = extracted_projects if extracted_projects else ""
    profile.certifications = ", ".join(extracted_certs) if extracted_certs else ""
    if extracted_education and not profile.branch:
        profile.branch = extracted_education[:100]
    if extracted_experience and not profile.summary:
        profile.summary = extracted_experience[:200]
    return profile
def generate_ats_report(db: Session, user_id: int, extracted_skills_list: list, profile: CandidateProfile):
    """
    Reusable function to generate/update the general ATS report after resume upload.
    """
    ats = db.query(ATSReport).filter(ATSReport.user_id == user_id, ATSReport.job_id == None).first()
    if not ats:
        ats = ATSReport(user_id=user_id, job_id=None)
        db.add(ats)
    role_skills_map = {
        "frontend": {"React", "JavaScript", "TypeScript", "CSS", "HTML", "Vue", "Angular", "Tailwind", "Next.js", "Redux"},
        "backend": {"Python", "Java", "Node.js", "C++", "SQL", "Docker", "Kubernetes", "AWS", "Go", "PostgreSQL", "FastAPI", "Django"},
        "full stack": {"React", "Node.js", "Python", "SQL", "MongoDB", "Docker", "JavaScript", "TypeScript", "PostgreSQL"},
        "data": {"Python", "Pandas", "Scikit-learn", "TensorFlow", "PyTorch", "SQL", "Machine Learning", "R", "NumPy", "Deep Learning"},
        "devops": {"AWS", "Docker", "Kubernetes", "CI/CD", "Terraform", "Linux", "Bash", "Python", "Ansible", "Jenkins"},
        "mobile": {"React Native", "Flutter", "Swift", "Kotlin", "Android", "iOS", "Dart", "SwiftUI"},
    }
    preferred_role = (profile.preferred_job_type or "general").lower() if profile else "general"
    standard_skills = {"Python", "JavaScript", "SQL", "Git", "AWS", "Docker", "Agile"}
    for key, skills in role_skills_map.items():
        if key in preferred_role:
            standard_skills = skills
            break
    user_skills_set = {s.lower() for s in extracted_skills_list}
    missing = [s for s in standard_skills if s.lower() not in user_skills_set]
    missing_skills_sample = missing[:3] if missing else []
    missing_keywords_sample = missing[3:5] if len(missing) > 3 else []
    base_score = min((len(user_skills_set) / 8.0) * 100, 85.0)
    random_bonus = random.uniform(5.0, 14.0)
    final_score = min(base_score + random_bonus, 99.0) if user_skills_set else random.uniform(30.0, 50.0)
    ats.ats_score = final_score
    ats.match_percentage = final_score
    ats.missing_skills = {"skills": missing_skills_sample}
    ats.missing_keywords = {"keywords": missing_keywords_sample}
    if len(user_skills_set) < 3:
        ats.suggestions = "Your resume seems light on technical keywords. Try adding more specific technologies and tools you've used."
    elif missing_skills_sample:
        ats.suggestions = f"Consider adding experience with {', '.join(missing_skills_sample)} to improve your general ATS visibility."
    else:
        ats.suggestions = "Your resume has a strong technical foundation! Keep it updated with your latest projects."
    return ats
@router.get("/job-types")
async def get_job_types(db: Session = Depends(get_db)):
    """Return distinct employment types from the jobs table."""
    rows = db.query(Job.employment_type).distinct().all()
    types = sorted([r[0] for r in rows if r[0]])
    return types
@router.get("/resume", response_model=ResumeOut)
async def get_resume(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    resume = db.query(Resume).filter(Resume.user_id == current_user.user_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="No resume found")
    return resume
@router.post("/resume", response_model=ResumeOut)
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    file_path = f"{UPLOAD_DIR}/{current_user.user_id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    pdf_text = extract_text_from_pdf(file_path)
    text_lower = pdf_text.lower()
    resume_keywords = ["education", "experience", "skills", "projects", "resume", "university", "college", "summary", "profile", "certifications", "bachelor", "degree", "work history", "objective"]
    keyword_matches = sum(1 for kw in resume_keywords if kw in text_lower)
    if keyword_matches < 2:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail="The uploaded document does not appear to be a valid resume. Please upload a real resume.")
    parsed_data = parse_resume(pdf_text)
    extracted_skills_list = parsed_data.get("skills", [])
    extracted_skills_dict = {"skills": extracted_skills_list}
    resume = db.query(Resume).filter(Resume.user_id == current_user.user_id).first()
    if resume:
        resume.resume_name = file.filename
        resume.file_path = file_path
        resume.extracted_skills = extracted_skills_dict
    else:
        resume = Resume(
            user_id=current_user.user_id,
            resume_name=file.filename,
            file_path=file_path,
            extracted_skills=extracted_skills_dict,
            is_default=True
        )
        db.add(resume)
    profile = sync_profile_from_resume(db, current_user.user_id, parsed_data)
    db.commit()
    db.refresh(resume)
    generate_ats_report(db, current_user.user_id, extracted_skills_list, profile)
    db.commit()
    return resume
@router.get("/ats", response_model=ATSReportOut)
def get_general_ats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ats = db.query(ATSReport).filter(ATSReport.user_id == current_user.user_id, ATSReport.job_id == None).first()
    if not ats:
        raise HTTPException(status_code=404, detail="No ATS report found. Upload a resume first.")
    return ats
@router.get("/jobs/recommendations", response_model=List[JobOut])
def get_job_recommendations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns jobs ranked by skill relevance to the user's resume.
    Uses the job_matcher service for intelligent sorting.
    """
    matched_jobs = get_matched_jobs(db, current_user.user_id, limit=15)
    return matched_jobs
@router.get("/jobs/saved", response_model=List[SavedJobOut])
def get_saved_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns all jobs the user has saved (swiped SAVE).
    """
    saved_swipes = (
        db.query(SwipeHistory)
        .options(joinedload(SwipeHistory.job).joinedload(Job.company))
        .filter(
            SwipeHistory.user_id == current_user.user_id,
            SwipeHistory.swipe_action == "SAVE"
        )
        .order_by(SwipeHistory.swiped_at.desc())
        .all()
    )
    result = []
    for swipe in saved_swipes:
        result.append(SavedJobOut(
            swipe_id=swipe.swipe_id,
            job=JobOut.model_validate(swipe.job),
            saved_at=str(swipe.swiped_at) if swipe.swiped_at else None
        ))
    return result
@router.delete("/jobs/saved/{job_id}", response_model=dict)
def unsave_job(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Remove a saved job (delete the SAVE swipe record).
    """
    swipe = db.query(SwipeHistory).filter(
        SwipeHistory.user_id == current_user.user_id,
        SwipeHistory.job_id == job_id,
        SwipeHistory.swipe_action == "SAVE"
    ).first()
    if not swipe:
        raise HTTPException(status_code=404, detail="Saved job not found")
    db.delete(swipe)
    db.commit()
    return {"message": f"Job {job_id} has been removed from saved jobs"}
@router.post("/jobs/swipe", response_model=SwipeActionResponse)
def swipe_job(swipe: SwipeActionRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(Job).options(joinedload(Job.company)).filter(Job.job_id == swipe.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    history = SwipeHistory(
        user_id=current_user.user_id,
        job_id=swipe.job_id,
        swipe_action=swipe.action
    )
    db.add(history)
    apply_url = None
    if swipe.action == "RIGHT":
        app = Application(
            user_id=current_user.user_id,
            job_id=swipe.job_id,
            status="Applied"
        )
        db.add(app)
        apply_url = job.apply_url or (job.company.career_page if job.company else None)
    db.commit()
    return SwipeActionResponse(
        message=f"Successfully swiped {swipe.action} on job {swipe.job_id}",
        apply_url=apply_url
    )