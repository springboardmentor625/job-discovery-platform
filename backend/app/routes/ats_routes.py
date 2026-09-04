
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Job, CandidateProfile, Resume, ATSReport
from ..auth import get_current_user
from ..services.ats_service import (
    calculate_ats_score,
    generate_improvement_suggestion
)


router = APIRouter(
    prefix="/api/ats",
    tags=["ATS"]
)


# ==========================================
# PER-JOB ATS SCORE
# Computes (or recomputes) the score, upserts
# the ATSReport row (one per user+job, per the
# unique constraint), and returns the breakdown.
# ==========================================

@router.get("/{job_id}")
def get_ats_score_for_job(
    job_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    profile = db.query(CandidateProfile).filter(
        CandidateProfile.user_id == user_id
    ).first()

    resume = db.query(Resume).filter(
        Resume.user_id == user_id,
        Resume.is_primary == True  # noqa: E712
    ).first()

    if not resume:

        raise HTTPException(
            status_code=404,
            detail="Upload a resume first to see your ATS score for this job."
        )

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
    # BUILD RESUME_DATA / JOB_DATA
    # Prefer explicit profile fields, fall
    # back to what was extracted from the
    # resume file itself.
    # ======================================

    resume_data = {
        "skills": (profile.skills if profile and profile.skills
                   else resume.extracted_skills),
        "experience_level": profile.experience if profile else None,
        "education": (profile.education if profile and profile.education
                      else resume.extracted_education),
        "resume_text": resume.extracted_text,
    }

    job_data = {
        "job_id": job.job_id,
        "skills": job.skills,
        "preferred_skills": job.preferred_skills,
        "experience_required": job.experience_required,
        "description": job.description,
    }

    result = calculate_ats_score(resume_data, job_data)

    # ======================================
    # OPTIONAL AI SUGGESTION (skips gracefully)
    # ======================================

    suggestion = generate_improvement_suggestion(
        result["missing_skills"],
        job.title
    )

    # ======================================
    # UPSERT ATSReport
    # ======================================

    existing_report = db.query(ATSReport).filter(
        ATSReport.user_id == user_id,
        ATSReport.job_id == job_id
    ).first()

    breakdown = result["breakdown"]
    missing_skills_str = ", ".join(result["missing_skills"])

    if existing_report:

        existing_report.resume_id = resume.resume_id
        existing_report.ats_score = result["ats_score"]
        existing_report.required_skills_score = breakdown["required"]
        existing_report.preferred_skills_score = breakdown["preferred"]
        existing_report.experience_score = breakdown["experience"]
        existing_report.semantic_score = breakdown["semantic"]
        existing_report.education_score = breakdown["education"]
        existing_report.missing_skills = missing_skills_str

        db.commit()

    else:

        report = ATSReport(
            user_id=user_id,
            job_id=job_id,
            resume_id=resume.resume_id,
            ats_score=result["ats_score"],
            required_skills_score=breakdown["required"],
            preferred_skills_score=breakdown["preferred"],
            experience_score=breakdown["experience"],
            semantic_score=breakdown["semantic"],
            education_score=breakdown["education"],
            missing_skills=missing_skills_str,
        )

        db.add(report)
        db.commit()

    return {
        "ats_score": result["ats_score"],
        "breakdown": result["breakdown"],
        "missing_skills": result["missing_skills"],
        "improvement_suggestion": suggestion,
    }


