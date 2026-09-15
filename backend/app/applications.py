import os
import re
from typing import Optional, List, Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from .database import get_db
from .models import Application, User, Job, Resume, Notification, Company, ATSReport, CandidateProfile
from .schemas import (
    ApplicationCreate,
    ApplicationResponse,
    RecruiterApplicationResponse,
    ApplicationStatusUpdate
)
from .auth import require_role, get_current_user
from .ats_reports import calculate_ats_analysis
from .resumes import resolve_resume_path, extract_pdf_text


router = APIRouter(
    prefix="/applications",
    tags=["Applications"]
)


def compute_or_get_job_match_score(
    resume: Optional[Resume],
    job: Optional[Job],
    db: Session
) -> tuple[Optional[float], list, list, Optional[str], bool]:
    """
    Computes or retrieves candidate's resume match score against the specific applied job.
    Returns: (match_score, matched_skills, missing_skills, match_suggestions, has_resume)
    """
    if not resume:
        return None, [], [], "Resume not provided for this application.", False

    if not job:
        return None, [], [], "Job details unavailable.", True

    # Prepare job skills list
    job_skills_list = []
    if isinstance(job.required_skills, list):
        job_skills_list = [str(s).strip() for s in job.required_skills if str(s).strip()]
    elif isinstance(job.required_skills, str):
        job_skills_list = [s.strip() for s in job.required_skills.replace(";", ",").split(",") if s.strip()]

    # Prepare resume skills list
    resume_skills_list = []
    if isinstance(resume.extracted_skills, list):
        resume_skills_list = [str(s).strip() for s in resume.extracted_skills if str(s).strip()]
    elif isinstance(resume.extracted_skills, str):
        resume_skills_list = [s.strip() for s in resume.extracted_skills.replace(";", ",").split(",") if s.strip()]

    # Check if an ATS report already exists for this resume and job
    existing_report = db.query(ATSReport).filter(
        ATSReport.resume_id == resume.resume_id,
        ATSReport.job_id == job.job_id
    ).first()

    if existing_report:
        try:
            score = float(existing_report.ats_score)
        except (ValueError, TypeError):
            score = 0.0

        missing = existing_report.missing_skills if isinstance(existing_report.missing_skills, list) else []
        suggestions = existing_report.suggestions

        resume_skills_lower = set(s.lower() for s in resume_skills_list)
        matched = [s for s in job_skills_list if s.lower() in resume_skills_lower]

        return round(score, 1), matched, missing, suggestions, True

    # Otherwise compute fresh analysis
    resume_text = ""
    if resume.raw_text:
        resume_text = resume.raw_text
    elif resume.file_path:
        pdf_path = resolve_resume_path(resume.file_path)
        if pdf_path:
            resume_text = extract_pdf_text(pdf_path)

    # If no resume text and no skills, score cannot be calculated
    if not resume_text and not resume_skills_list:
        return None, [], job_skills_list, "Resume Match Score unavailable — resume could not be analyzed.", True

    ats_score, match_percentage, missing_skills, missing_keywords, suggestions = calculate_ats_analysis(
        resume_text=resume_text,
        job_description=job.description or job.title or "",
        job_skills=job_skills_list,
        resume_skills=resume_skills_list
    )

    resume_skills_lower = set(s.lower() for s in resume_skills_list)
    if resume_text:
        resume_text_lower = resume_text.lower()
        matched = [
            s for s in job_skills_list
            if s.lower() in resume_skills_lower or re.search(r'\b' + re.escape(s.lower()) + r'\b', resume_text_lower)
        ]
    else:
        matched = [s for s in job_skills_list if s.lower() in resume_skills_lower]

    score_val = round(ats_score, 1)

    # Cache report to ATSReport table
    try:
        new_report = ATSReport(
            resume_id=resume.resume_id,
            job_id=job.job_id,
            ats_score=str(score_val),
            match_percentage=str(round(match_percentage, 1)),
            missing_skills=missing_skills,
            missing_keywords=missing_keywords,
            suggestions=suggestions
        )
        db.add(new_report)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error caching ATSReport: {e}")

    return score_val, matched, missing_skills, suggestions, True


@router.post("/", response_model=ApplicationResponse)
def create_application(
    application: ApplicationCreate,
    current_user: User = Depends(require_role("candidate")),
    db: Session = Depends(get_db)
):
    # Check job exists
    job = db.query(Job).filter(
        Job.job_id == application.job_id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    # Check resume exists and belongs to current user
    resume = db.query(Resume).filter(
        Resume.resume_id == application.resume_id,
        Resume.user_id == current_user.user_id
    ).first()

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found or does not belong to you"
        )

    # Prevent duplicate application
    existing_application = db.query(Application).filter(
        Application.user_id == current_user.user_id,
        Application.job_id == application.job_id
    ).first()

    if existing_application:
        raise HTTPException(
            status_code=400,
            detail="You have already applied for this job"
        )

    new_application = Application(
        user_id=current_user.user_id,
        job_id=application.job_id,
        resume_id=application.resume_id,
        status="Applied"
    )

    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    # Automatically calculate / cache ATS match report
    compute_or_get_job_match_score(resume, job, db)

    # Automatically create notification for candidate
    app_notification = Notification(
        user_id=current_user.user_id,
        title="Application Submitted",
        message=f"Your application for '{job.title}' was successfully submitted.",
        notification_type="application",
        related_job_id=job.job_id,
        related_application_id=new_application.application_id,
        is_read=False
    )
    db.add(app_notification)
    db.commit()

    return new_application


@router.get("/", response_model=list[ApplicationResponse])
def get_my_applications(
    current_user: User = Depends(require_role("candidate")),
    db: Session = Depends(get_db)
):
    applications = db.query(Application).filter(
        Application.user_id == current_user.user_id
    ).all()

    return applications


@router.get("/recruiter/all", response_model=list[RecruiterApplicationResponse])
def get_recruiter_applications(
    current_user: User = Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    """Fetch all candidate applications submitted for jobs posted exclusively by this recruiter."""
    recruiter_jobs = db.query(Job).filter(
        Job.recruiter_id == current_user.user_id
    ).all()
    job_ids = [j.job_id for j in recruiter_jobs]

    if not job_ids:
        return []

    applications = db.query(Application).filter(
        Application.job_id.in_(job_ids)
    ).order_by(Application.applied_at.desc()).all()

    result = []
    for app in applications:
        candidate = db.query(User).filter(User.user_id == app.user_id).first()
        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == app.user_id).first()
        job = db.query(Job).filter(Job.job_id == app.job_id).first()
        company = db.query(Company).filter(Company.company_id == job.company_id).first() if job and job.company_id else None
        resume = db.query(Resume).filter(Resume.resume_id == app.resume_id).first() if app.resume_id else None

        match_score, matched_skills, missing_skills, match_suggestions, has_resume = compute_or_get_job_match_score(resume, job, db)

        result.append(
            RecruiterApplicationResponse(
                application_id=app.application_id,
                user_id=app.user_id,
                candidate_name=candidate.full_name if candidate else "Candidate",
                candidate_email=candidate.email if candidate else "N/A",
                candidate_phone=candidate.phone if candidate else None,
                candidate_headline=profile.headline if profile else None,
                candidate_location=profile.location if profile else None,
                candidate_summary=profile.summary if profile else None,
                candidate_experience_years=profile.experience_years if profile else None,
                candidate_education=profile.education if profile else None,
                candidate_projects=profile.projects if profile else None,
                candidate_certifications=profile.certifications if profile else None,
                job_id=app.job_id,
                job_title=job.title if job else "Job",
                job_location=job.location if job else None,
                job_employment_type=job.employment_type if job else None,
                job_required_skills=job.required_skills if job else [],
                company_name=company.company_name if company else None,
                resume_id=app.resume_id,
                resume_name=resume.resume_name if resume else None,
                resume_skills=resume.extracted_skills if resume else [],
                resume_match_score=match_score,
                resume_ats_score=resume.ats_score if resume else None,
                missing_skills=missing_skills,
                matched_skills=matched_skills,
                match_suggestions=match_suggestions,
                has_resume=has_resume,
                status=app.status or "Applied",
                applied_at=app.applied_at
            )
        )

    return result


@router.get("/{application_id}/resume")
def get_application_resume(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Securely fetch and stream the candidate's PDF resume for an application.
    Recruiters can only access resumes for jobs they are authorized to manage.
    Candidates can only access resumes for their own applications.
    """
    application = db.query(Application).filter(
        Application.application_id == application_id
    ).first()

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    # Role & Ownership Authorization
    if current_user.role == "recruiter":
        job = db.query(Job).filter(Job.job_id == application.job_id).first()
        if not job or job.recruiter_id != current_user.user_id:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to view resumes for this job application"
            )
    elif current_user.role == "candidate":
        if application.user_id != current_user.user_id:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to view this application resume"
            )
    elif current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Unauthorized to access this resume"
        )

    if not application.resume_id:
        raise HTTPException(
            status_code=404,
            detail="No resume attached to this application"
        )

    resume = db.query(Resume).filter(
        Resume.resume_id == application.resume_id
    ).first()

    if not resume or not resume.file_path:
        raise HTTPException(
            status_code=404,
            detail="Resume record not found"
        )

    real_path = resolve_resume_path(resume.file_path)
    if not real_path or not os.path.exists(real_path) or not os.path.isfile(real_path):
        raise HTTPException(
            status_code=404,
            detail="Resume PDF file not found on disk"
        )

    clean_filename = resume.resume_name or os.path.basename(real_path)
    if not clean_filename.lower().endswith(".pdf"):
        clean_filename += ".pdf"

    return FileResponse(
        path=real_path,
        media_type="application/pdf",
        filename=clean_filename,
        content_disposition_type="inline"
    )


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_my_application(
    application_id: int,
    current_user: User = Depends(require_role("candidate")),
    db: Session = Depends(get_db)
):
    application = db.query(Application).filter(
        Application.application_id == application_id,
        Application.user_id == current_user.user_id
    ).first()

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    return application


@router.get("/job/{job_id}", response_model=list[ApplicationResponse])
def get_job_applications(
    job_id: int,
    current_user: User = Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(
        Job.job_id == job_id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    if job.recruiter_id != current_user.user_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to view applications for this job"
        )

    applications = db.query(Application).filter(
        Application.job_id == job_id
    ).all()

    return applications


@router.put("/{application_id}/status", response_model=ApplicationResponse)
def update_application_status(
    application_id: int,
    status_update: ApplicationStatusUpdate,
    current_user: User = Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    status = status_update.status
    application = db.query(Application).filter(
        Application.application_id == application_id
    ).first()

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    job = db.query(Job).filter(Job.job_id == application.job_id).first()
    if not job or job.recruiter_id != current_user.user_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to update this application status"
        )

    allowed_statuses = {
        "Applied",
        "Shortlisted",
        "Interview",
        "Selected",
        "Offered",
        "Rejected"
    }

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid application status"
        )

    application.status = status

    # Create notification for candidate
    job = db.query(Job).filter(Job.job_id == application.job_id).first()
    job_title = job.title if job else "your applied position"
    status_notification = Notification(
        user_id=application.user_id,
        title=f"Application Update: {status}",
        message=f"Your application status for '{job_title}' has been updated to: {status}.",
        notification_type="status_update",
        related_job_id=application.job_id,
        related_application_id=application.application_id,
        is_read=False
    )
    db.add(status_notification)

    db.commit()
    db.refresh(application)

    return application