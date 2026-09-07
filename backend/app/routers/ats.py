from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)

from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    User,
    Resume,
    Job,
    ATSReport
)

from ..utils.security import (
    verify_access_token
)

from ..services.ats_service import (
    calculate_ats_score,
    generate_suggestions
)


router = APIRouter(
    prefix="/api/ats",
    tags=["ATS Analysis"]
)

security = HTTPBearer()


# =========================================================
# HELPER - GET CURRENT USER ID
# =========================================================

def get_current_user_id(
    credentials: HTTPAuthorizationCredentials
):

    token = credentials.credentials

    payload = verify_access_token(token)

    if payload is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user_id = payload.get("sub")

    if user_id is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    try:

        return int(user_id)

    except (TypeError, ValueError):

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token"
        )


# =========================================================
# ATS ANALYSIS
# =========================================================

@router.post(
    "/analyze",
    status_code=status.HTTP_201_CREATED
)
def analyze_resume(
    resume_id: int,
    job_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # 1. GET USER ID
    # -----------------------------------------------------

    user_id = get_current_user_id(
        credentials
    )

    # -----------------------------------------------------
    # 2. CHECK USER
    # -----------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.user_id == user_id
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    # -----------------------------------------------------
    # 3. GET RESUME
    # -----------------------------------------------------

    resume = (
        db.query(Resume)
        .filter(
            Resume.resume_id == resume_id,
            Resume.user_id == user_id
        )
        .first()
    )

    if not resume:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )

    # -----------------------------------------------------
    # 4. GET JOB
    # -----------------------------------------------------

    job = (
        db.query(Job)
        .filter(
            Job.job_id == job_id
        )
        .first()
    )

    if not job:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    # -----------------------------------------------------
    # 5. GET RESUME SKILLS
    # -----------------------------------------------------

    resume_skills = resume.extracted_skills

    if not resume_skills:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No extracted skills found in resume"
        )

    # -----------------------------------------------------
    # 6. GET REQUIRED JOB SKILLS
    # -----------------------------------------------------

    required_skills = job.required_skills

    if not required_skills:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No required skills found for this job"
        )

    # -----------------------------------------------------
    # 7. CALCULATE ATS SCORE
    # -----------------------------------------------------

    result = calculate_ats_score(
        resume_skills=resume_skills,
        required_skills=required_skills
    )

    # -----------------------------------------------------
    # 8. GENERATE SUGGESTIONS
    # -----------------------------------------------------

    suggestions = generate_suggestions(
        result["missing_skills"]
    )

    # -----------------------------------------------------
    # 9. CREATE ATS REPORT
    # -----------------------------------------------------

    new_report = ATSReport(
        resume_id=resume.resume_id,
        job_id=job.job_id,
        ats_score=result["ats_score"],
        match_percentage=result["match_percentage"],
        missing_skills=result["missing_skills"],
        missing_keywords=result["missing_skills"],
        suggestions=suggestions
    )

    db.add(new_report)

    # -----------------------------------------------------
    # 10. SAVE REPORT
    # -----------------------------------------------------

    try:

        db.commit()

        db.refresh(new_report)

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

    # -----------------------------------------------------
    # 11. RETURN RESULT
    # -----------------------------------------------------

    return {
        "message": "ATS analysis completed successfully",

        "ats_report_id":
            new_report.ats_report_id,

        "user_id":
            user_id,

        "resume_id":
            resume.resume_id,

        "job_id":
            job.job_id,

        "ats_score":
            float(new_report.ats_score),

        "match_percentage":
            float(new_report.match_percentage),

        "matched_skills":
            result["matched_skills"],

        "missing_skills":
            result["missing_skills"],

        "suggestions":
            suggestions
    }


# =========================================================
# GET ALL ATS REPORTS FOR CURRENT CANDIDATE
# =========================================================

@router.get("/")
def get_my_ats_reports(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # 1. GET USER ID
    # -----------------------------------------------------

    user_id = get_current_user_id(
        credentials
    )

    # -----------------------------------------------------
    # 2. CHECK USER
    # -----------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.user_id == user_id
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # -----------------------------------------------------
    # 3. GET USER RESUME IDS
    # -----------------------------------------------------

    user_resume_ids = (
        db.query(Resume.resume_id)
        .filter(
            Resume.user_id == user_id
        )
        .all()
    )

    resume_ids = [
        resume_id
        for (resume_id,) in user_resume_ids
    ]

    # -----------------------------------------------------
    # 4. GET ATS REPORTS
    # -----------------------------------------------------

    if not resume_ids:

        return {
            "user_id": user_id,
            "reports": [],
            "count": 0
        }

    reports = (
        db.query(ATSReport)
        .filter(
            ATSReport.resume_id.in_(resume_ids)
        )
        .order_by(
            ATSReport.analyzed_at.desc()
        )
        .all()
    )

    # -----------------------------------------------------
    # 5. BUILD RESPONSE
    # -----------------------------------------------------

    report_list = []

    for report in reports:

        job = (
            db.query(Job)
            .filter(
                Job.job_id == report.job_id
            )
            .first()
        )

        resume = (
            db.query(Resume)
            .filter(
                Resume.resume_id == report.resume_id
            )
            .first()
        )

        report_list.append({
            "ats_report_id":
                report.ats_report_id,

            "resume_id":
                report.resume_id,

            "resume_name":
                resume.resume_name
                if resume else None,

            "job_id":
                report.job_id,

            "job_title":
                job.title
                if job else None,

            "ats_score":
                float(report.ats_score)
                if report.ats_score is not None
                else None,

            "match_percentage":
                float(report.match_percentage)
                if report.match_percentage is not None
                else None,

            "missing_skills":
                report.missing_skills,

            "missing_keywords":
                report.missing_keywords,

            "suggestions":
                report.suggestions,

            "analyzed_at":
                report.analyzed_at
        })

    # -----------------------------------------------------
    # 6. RETURN REPORTS
    # -----------------------------------------------------

    return {
        "user_id": user_id,
        "reports": report_list,
        "count": len(report_list)
    }


# =========================================================
# GET ONE ATS REPORT
# =========================================================

@router.get(
    "/{ats_report_id}"
)
def get_ats_report(
    ats_report_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # 1. GET USER ID
    # -----------------------------------------------------

    user_id = get_current_user_id(
        credentials
    )

    # -----------------------------------------------------
    # 2. FIND ATS REPORT
    # -----------------------------------------------------

    report = (
        db.query(ATSReport)
        .join(
            Resume,
            ATSReport.resume_id == Resume.resume_id
        )
        .filter(
            ATSReport.ats_report_id == ats_report_id,
            Resume.user_id == user_id
        )
        .first()
    )

    # -----------------------------------------------------
    # 3. CHECK REPORT
    # -----------------------------------------------------

    if not report:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ATS report not found"
        )

    # -----------------------------------------------------
    # 4. GET JOB
    # -----------------------------------------------------

    job = (
        db.query(Job)
        .filter(
            Job.job_id == report.job_id
        )
        .first()
    )

    # -----------------------------------------------------
    # 5. GET RESUME
    # -----------------------------------------------------

    resume = (
        db.query(Resume)
        .filter(
            Resume.resume_id == report.resume_id
        )
        .first()
    )

    # -----------------------------------------------------
    # 6. RETURN REPORT
    # -----------------------------------------------------

    return {
        "ats_report_id":
            report.ats_report_id,

        "user_id":
            user_id,

        "resume_id":
            report.resume_id,

        "resume_name":
            resume.resume_name
            if resume else None,

        "job_id":
            report.job_id,

        "job_title":
            job.title
            if job else None,

        "ats_score":
            float(report.ats_score)
            if report.ats_score is not None
            else None,

        "match_percentage":
            float(report.match_percentage)
            if report.match_percentage is not None
            else None,

        "missing_skills":
            report.missing_skills,

        "missing_keywords":
            report.missing_keywords,

        "suggestions":
            report.suggestions,

        "analyzed_at":
            report.analyzed_at
    }
