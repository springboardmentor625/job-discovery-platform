import random
import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import not_
from app.database import get_db
from app.routers.auth import get_current_user
from app.models import User, Job, SwipeHistory, Resume, ATSReport, Application, CandidateProfile, Recommendation
from app.schemas import JobOut, SwipeActionRequest, SwipeActionResponse, ResumeOut, ATSReportOut, SavedJobOut, ApplicationOut
from app.services.nlp_parser import parse_resume, extract_text_from_pdf
from app.services.job_matcher import get_matched_jobs
router = APIRouter(prefix="/candidate", tags=["candidate"])
UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)
def sync_profile_from_resume(db: Session, user_id: int, parsed_data: dict) -> CandidateProfile:
    """
    Reusable function that syncs the CandidateProfile with data extracted
    from a resume. Merges data rather than overwriting existing manual entries.
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
    
    if extracted_skills and not profile.skills:
        profile.skills = ", ".join(extracted_skills)
    elif extracted_skills:
        # Merge skills uniquely
        existing_skills = {s.strip().lower() for s in profile.skills.split(",")}
        new_skills = [s for s in extracted_skills if s.lower() not in existing_skills]
        if new_skills:
            profile.skills = profile.skills + ", " + ", ".join(new_skills)
            
    if extracted_projects and not profile.projects:
        profile.projects = extracted_projects
    if extracted_certs and not profile.certifications:
        profile.certifications = ", ".join(extracted_certs)
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
    
    # Deterministic scoring
    matched_skills = len({s.lower() for s in standard_skills}.intersection(user_skills_set))
    target_skill_count = min(len(standard_skills), 8)
    skill_match_score = min(100.0, (matched_skills / max(target_skill_count, 1)) * 100.0)
    
    keyword_match_score = min(100.0, (len(user_skills_set) / 15.0) * 100.0)
    experience_score = 100.0 if (profile and profile.experience_years) else (80.0 if (profile and profile.summary) else 20.0)
    education_score = 100.0 if (profile and profile.branch) else 0.0
    project_score = 100.0 if (profile and profile.projects) else 0.0
    structure_score = 100.0 # Good structure if it parsed successfully
    
    final_score = (
        0.40 * skill_match_score +
        0.20 * keyword_match_score +
        0.15 * experience_score +
        0.10 * education_score +
        0.10 * project_score +
        0.05 * structure_score
    )
    final_score = min(max(final_score, 0.0), 100.0)
    
    ats.ats_score = round(final_score, 1)
    ats.match_percentage = round(final_score, 1)
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
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file format.")
        
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds the 5MB limit.")
        
    import uuid
    secure_filename = f"{uuid.uuid4().hex}.pdf"
    file_path = f"{UPLOAD_DIR}/{secure_filename}"
    
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
        if os.path.exists(resume.file_path):
            try:
                os.remove(resume.file_path)
            except OSError:
                pass
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
def get_job_recommendations(limit: int = 15, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns jobs ranked by skill relevance to the user's resume.
    Uses the job_matcher service for intelligent sorting.
    """
    matched_jobs = get_matched_jobs(db, current_user.user_id, limit=limit, offset=offset)
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
        
    # Check if a swipe already exists for this action
    existing_swipe = db.query(SwipeHistory).filter(
        SwipeHistory.user_id == current_user.user_id,
        SwipeHistory.job_id == swipe.job_id,
        SwipeHistory.swipe_action == swipe.action
    ).first()
    
    if existing_swipe and swipe.action == "SAVE":
        raise HTTPException(status_code=400, detail="Job already saved")
        
    if not existing_swipe:
        history = SwipeHistory(
            user_id=current_user.user_id,
            job_id=swipe.job_id,
            swipe_action=swipe.action
        )
        db.add(history)
        
    apply_url = None
    if swipe.action == "RIGHT":
        existing_app = db.query(Application).filter(
            Application.user_id == current_user.user_id,
            Application.job_id == swipe.job_id
        ).first()
        
        if existing_app:
            raise HTTPException(status_code=400, detail="You have already applied to this job")
            
        resume = db.query(Resume).filter(Resume.user_id == current_user.user_id).first()
        app = Application(
            user_id=current_user.user_id,
            job_id=swipe.job_id,
            resume_id=resume.resume_id if resume else None,
            status="Applied"
        )
        db.add(app)
        apply_url = job.apply_url or (job.company.career_page if job.company else None)
        
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Could not process swipe action due to a conflict.")
        
    return SwipeActionResponse(
        message=f"Successfully swiped {swipe.action} on job {swipe.job_id}",
        apply_url=apply_url
    )

@router.get("/applications", response_model=List[ApplicationOut])
def get_applications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns all applications the user has made (RIGHT swipes).
    """
    apps = (
        db.query(Application)
        .options(joinedload(Application.job).joinedload(Job.company))
        .filter(Application.user_id == current_user.user_id)
        .order_by(Application.applied_at.desc())
        .all()
    )
    result = []
    for a in apps:
        result.append(ApplicationOut(
            application_id=a.application_id,
            job_id=a.job_id,
            job=JobOut.model_validate(a.job),
            status=a.status,
            applied_at=str(a.applied_at) if a.applied_at else None
        ))
    return result