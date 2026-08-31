from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_

from .database import get_db
from .models import ATSReport, Resume, Job, User
from .schemas import ATSReportCreate, ATSReportResponse
from .auth import get_current_user
from pypdf import PdfReader
import re


router = APIRouter(
    prefix="/ats-reports",
    tags=["ATS Reports"]
)


def extract_keywords_from_job(job_description: str, job_skills: list) -> list:
    """Extract important keywords from job description"""
    
    # Common ATS keywords
    keywords = set()
    
    # Split description into words
    words = re.findall(r'\b\w+\b', job_description.lower())
    
    # Add job skills
    if job_skills:
        keywords.update(s.lower() for s in job_skills)
    
    # Add high-value keywords
    important_terms = [
        "management", "leadership", "team", "project", "experience",
        "proven", "track record", "communication", "analytical",
        "problem-solving", "technical", "strategic", "creative",
        "innovative", "results-driven", "customer", "client",
        "data", "software", "system", "process", "development"
    ]
    
    for term in important_terms:
        if term in words:
            keywords.add(term)
    
    return list(keywords)


def calculate_ats_analysis(
    resume_text: str,
    job_description: str,
    job_skills: list,
    resume_skills: list
) -> tuple:
    """
    Analyze resume against job requirements.
    Returns: (ats_score, match_percentage, missing_skills, missing_keywords, suggestions)
    """
    
    resume_lower = resume_text.lower()
    job_lower = job_description.lower()
    
    # =====================
    # 1. SKILL MATCHING
    # =====================
    resume_skills_set = set(s.lower() for s in (resume_skills or []))
    job_skills_set = set(s.lower() for s in (job_skills or []))
    
    matched_skills = resume_skills_set.intersection(job_skills_set)
    missing_skills = job_skills_set - resume_skills_set
    
    if len(job_skills_set) > 0:
        skill_match_pct = (len(matched_skills) / len(job_skills_set)) * 100
    else:
        skill_match_pct = 0
    
    # =====================
    # 2. KEYWORD MATCHING
    # =====================
    job_keywords = extract_keywords_from_job(job_description, job_skills)
    missing_keywords = []
    
    for keyword in job_keywords:
        if keyword not in resume_lower:
            missing_keywords.append(keyword)
    
    if len(job_keywords) > 0:
        keyword_match_pct = ((len(job_keywords) - len(missing_keywords)) / len(job_keywords)) * 100
    else:
        keyword_match_pct = 0
    
    # =====================
    # 3. CALCULATE ATS SCORE
    # =====================
    # Components:
    # - Skill match: 50%
    # - Keyword match: 30%
    # - Format/structure: 20%
    
    skill_score = (len(matched_skills) / max(len(job_skills_set), 1)) * 50
    keyword_score = keyword_match_pct * 0.3
    
    # Format check (assume well-formatted if has sections)
    format_score = 0
    format_keywords = ["education", "experience", "skills", "projects", "certifications"]
    format_count = sum(1 for keyword in format_keywords if keyword in resume_lower)
    format_score = (format_count / len(format_keywords)) * 20
    
    ats_score = skill_score + keyword_score + format_score
    ats_score = min(max(ats_score, 0), 100)  # Clamp to 0-100
    
    # =====================
    # 4. OVERALL MATCH
    # =====================
    match_percentage = (skill_match_pct + keyword_match_pct) / 2
    
    # =====================
    # 5. GENERATE SUGGESTIONS
    # =====================
    suggestions = []
    
    if len(missing_skills) > 0:
        missing_list = ", ".join(list(missing_skills)[:5])
        if len(missing_skills) > 5:
            missing_list += f", and {len(missing_skills) - 5} more"
        suggestions.append(f"Add or highlight: {missing_list}")
    
    if len(missing_keywords) > 5:
        key_sample = ", ".join(missing_keywords[:5])
        suggestions.append(f"Include keywords: {key_sample}, etc.")
    elif len(missing_keywords) > 0:
        key_list = ", ".join(missing_keywords)
        suggestions.append(f"Include keywords: {key_list}")
    
    if ats_score < 50:
        suggestions.append("Consider restructuring resume to match job requirements more closely")
    
    if len(matched_skills) > 0:
        suggestions.append(f"Great! You have {len(matched_skills)} of the required skills. Emphasize these in your profile.")
    
    if not suggestions:
        if ats_score >= 80:
            suggestions.append("Excellent match! Your resume aligns well with this job.")
        else:
            suggestions.append("Good match. Consider highlighting relevant experience.")
    
    suggestions_text = " | ".join(suggestions)
    
    return ats_score, match_percentage, list(missing_skills), missing_keywords, suggestions_text


@router.post("/analyze", response_model=ATSReportResponse)
def analyze_resume_for_job(
    resume_id: int,
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze a resume against a job posting.
    Returns ATS score, missing skills/keywords, and improvement suggestions.
    """
    
    # Get resume (verify ownership)
    resume = db.query(Resume).filter(
        and_(
            Resume.resume_id == resume_id,
            Resume.user_id == current_user.user_id
        )
    ).first()
    
    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )
    
    # Get job
    job = db.query(Job).filter(Job.job_id == job_id).first()
    
    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )
    
    # Check if report already exists
    existing_report = db.query(ATSReport).filter(
        and_(
            ATSReport.resume_id == resume_id,
            ATSReport.job_id == job_id
        )
    ).first()
    
    if existing_report:
        return existing_report
    
    # Extract resume text from PDF with safe fallback
    resume_skills_list = []
    if isinstance(resume.extracted_skills, list):
        resume_skills_list = [str(s).strip() for s in resume.extracted_skills if str(s).strip()]
    elif isinstance(resume.extracted_skills, str):
        resume_skills_list = [s.strip() for s in resume.extracted_skills.replace(";", ",").split(",") if s.strip()]

    job_skills_list = []
    if isinstance(job.required_skills, list):
        job_skills_list = [str(s).strip() for s in job.required_skills if str(s).strip()]
    elif isinstance(job.required_skills, str):
        job_skills_list = [s.strip() for s in job.required_skills.replace(";", ",").split(",") if s.strip()]

    resume_text = ""
    if resume.file_path:
        try:
            reader = PdfReader(resume.file_path)
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    resume_text += text + "\n"
        except Exception:
            pass

    if not resume_text and resume_skills_list:
        resume_text = f"Candidate Resume. Skills: {', '.join(resume_skills_list)}."

    # Perform analysis
    ats_score, match_pct, missing_skills, missing_keywords, suggestions = calculate_ats_analysis(
        resume_text,
        job.description or "",
        job_skills_list,
        resume_skills_list
    )
    
    # Create and save report
    report = ATSReport(
        resume_id=resume_id,
        job_id=job_id,
        ats_score=str(round(ats_score, 2)),
        match_percentage=str(round(match_pct, 2)),
        missing_skills=missing_skills,
        missing_keywords=missing_keywords,
        suggestions=suggestions
    )
    
    db.add(report)
    db.commit()
    db.refresh(report)
    
    return report


@router.get("/{ats_report_id}", response_model=ATSReportResponse)
def get_ats_report(
    ats_report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific ATS report"""
    
    report = db.query(ATSReport).filter(
        ATSReport.ats_report_id == ats_report_id
    ).first()
    
    if report is None:
        raise HTTPException(
            status_code=404,
            detail="ATS report not found"
        )
    
    # Verify user owns the resume
    resume = db.query(Resume).filter(
        Resume.resume_id == report.resume_id
    ).first()
    
    if resume.user_id != current_user.user_id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view this report"
        )
    
    return report


@router.get("/resume/{resume_id}", response_model=list[ATSReportResponse])
def get_reports_for_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all ATS reports for a specific resume"""
    
    # Verify user owns the resume
    resume = db.query(Resume).filter(
        and_(
            Resume.resume_id == resume_id,
            Resume.user_id == current_user.user_id
        )
    ).first()
    
    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )
    
    reports = db.query(ATSReport).filter(
        ATSReport.resume_id == resume_id
    ).order_by(ATSReport.analyzed_at.desc()).all()
    
    return reports


@router.get("/job/{job_id}", response_model=list[ATSReportResponse])
def get_reports_for_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all ATS reports for a specific job (recruiter only)"""
    
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can view job reports"
        )
    
    reports = db.query(ATSReport).filter(
        ATSReport.job_id == job_id
    ).all()
    
    return reports
