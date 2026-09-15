from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from sqlalchemy import func
from .models import Job, User, SwipeHistory, Resume, Application, CandidateProfile, Company, ATSReport, Recommendation, Notification
from .schemas import JobCreate, JobResponse, JobUpdate
from .auth import require_role, get_current_user
from .matching import calculate_job_match


router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"]
)


def attach_competition_info(job: Job, db: Session) -> Job:
    """Calculate applicant count, competition level, and company name for a job."""
    count = db.query(func.count(Application.application_id)).filter(
        Application.job_id == job.job_id
    ).scalar() or 0
    
    job.applicant_count = count
    if count < 5:
        job.competition_level = "Low"
        job.is_early_applicant = True
    elif count <= 15:
        job.competition_level = "Medium"
        job.is_early_applicant = False
    else:
        job.competition_level = "High"
        job.is_early_applicant = False

    # Attach company name
    if job.company_id:
        company = db.query(Company).filter(Company.company_id == job.company_id).first()
        job.company_name = company.company_name if company else None
        
    return job


@router.post("/", response_model=JobResponse)
def create_job(
    job: JobCreate,
    current_user: User = Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    company_id = job.company_id
    if not company_id and job.company_name:
        comp = db.query(Company).filter(func.lower(Company.company_name) == func.lower(job.company_name.strip())).first()
        if not comp:
            comp = Company(
                company_name=job.company_name.strip(),
                company_type="Tech",
                industry="Information Technology",
                headquarters=job.location or "Global"
            )
            db.add(comp)
            db.commit()
            db.refresh(comp)
        company_id = comp.company_id

    if not company_id:
        first_comp = db.query(Company).first()
        if first_comp:
            company_id = first_comp.company_id
        else:
            comp = Company(
                company_name="SwipeX Partner",
                company_type="Tech",
                industry="Information Technology",
                headquarters="Remote"
            )
            db.add(comp)
            db.commit()
            db.refresh(comp)
            company_id = comp.company_id

    new_job = Job(
        company_id=company_id,
        title=job.title,
        description=job.description,
        location=job.location,
        employment_type=job.employment_type or "Full-time",
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        experience_required=job.experience_required,
        required_skills=job.required_skills,
        status=job.status or "Active",
        recruiter_id=current_user.user_id
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return attach_competition_info(new_job, db)


@router.get("/recruiter/my-jobs", response_model=list[JobResponse])
def get_my_posted_jobs(
    current_user: User = Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    """Retrieve all jobs posted exclusively by the current authenticated recruiter."""
    jobs = db.query(Job).filter(
        Job.recruiter_id == current_user.user_id
    ).order_by(Job.posted_date.desc()).all()

    return [attach_competition_info(j, db) for j in jobs]

@router.get("/", response_model=list[JobResponse])
def get_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get all jobs
    jobs = db.query(Job).all()

    # Get user's swipe history
    swipe_history = db.query(SwipeHistory).filter(
        SwipeHistory.user_id == current_user.user_id
    ).all()

    # Jobs already passed
    passed_job_ids = {
        swipe.job_id
        for swipe in swipe_history
        if swipe.swipe_action == "Pass"
    }

    # Jobs the user is interested in
    interested_job_ids = {
        swipe.job_id
        for swipe in swipe_history
        if swipe.swipe_action == "Interested"
    }

    # User resume skills
    user_resume = db.query(Resume).filter(
        Resume.user_id == current_user.user_id
    ).order_by(Resume.is_default.desc(), Resume.resume_id.desc()).first()
    
    resume_skills = set(
        str(s).lower() for s in (user_resume.extracted_skills or [])
    ) if user_resume else set()

    # Candidate profile
    candidate_profile = db.query(CandidateProfile).filter(
        CandidateProfile.user_id == current_user.user_id
    ).first()

    # Collect skills from interested jobs with a cap to prevent overfitting
    interested_skills = set()
    for job in jobs:
        if job.job_id in interested_job_ids:
            if isinstance(job.required_skills, list):
                interested_skills.update(
                    str(skill).lower()
                    for skill in job.required_skills
                )

    # Multi-signal ranking algorithm
    def calculate_job_priority(job):
        score = 0.0
        job_skills = set(
            str(s).lower() for s in (job.required_skills or [])
        ) if isinstance(job.required_skills, list) else set()

        # 1. Resume skill match (Primary signal: 40%)
        if resume_skills and job_skills:
            matched_resume = len(job_skills.intersection(resume_skills))
            score += matched_resume * 10

        # 2. Candidate profile location/type match (20%)
        if candidate_profile:
            if candidate_profile.location and job.location and candidate_profile.location.lower() in job.location.lower():
                score += 8
            if candidate_profile.preferred_job_type and job.employment_type and candidate_profile.preferred_job_type.lower() in job.employment_type.lower():
                score += 8

        # 3. Swipe history signal (Adaptive, capped at 15% to avoid overfitting)
        num_swipes = len(swipe_history)
        if num_swipes > 0 and interested_skills and job_skills:
            # Low weight for few swipes, moderate weight for more swipes
            weight = min(0.15, 0.05 + 0.02 * num_swipes)
            matched_swipe = len(job_skills.intersection(interested_skills))
            score += matched_swipe * weight * 10

        # 4. Early applicant / Low competition boost
        applicant_count = db.query(func.count(Application.application_id)).filter(
            Application.job_id == job.job_id
        ).scalar() or 0
        if applicant_count < 5:
            score += 5  # Early applicant advantage

        # 5. Freshness boost
        if job.job_id not in interested_job_ids and job.job_id not in passed_job_ids:
            score += 3  # Unseen job priority

        return score

    # Available jobs: include unseen jobs first, then interested, passed last
    # (Pass does not permanently delete the job from discovery search, but lowers priority)
    unseen_jobs = [j for j in jobs if j.job_id not in passed_job_ids and j.job_id not in interested_job_ids]
    interested_jobs = [j for j in jobs if j.job_id in interested_job_ids]
    passed_jobs = [j for j in jobs if j.job_id in passed_job_ids]

    unseen_jobs.sort(key=calculate_job_priority, reverse=True)
    interested_jobs.sort(key=calculate_job_priority, reverse=True)
    passed_jobs.sort(key=calculate_job_priority, reverse=True)

    ordered_jobs = unseen_jobs + interested_jobs + passed_jobs

    # Attach competition info to all jobs
    for j in ordered_jobs:
        attach_competition_info(j, db)

    return ordered_jobs

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.job_id == job_id).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    return attach_competition_info(job, db)

@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    job_data: JobUpdate,
    current_user: User = Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.job_id == job_id).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    # Check ownership
    if job.recruiter_id != current_user.user_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to modify this job"
        )

    update_data = job_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(job, key, value)

    db.commit()
    db.refresh(job)

    return attach_competition_info(job, db)

@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    current_user: User = Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.job_id == job_id).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    # Check ownership
    if job.recruiter_id != current_user.user_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to delete this job"
        )

    # Cascade cleanups
    try:
        db.query(Notification).filter(Notification.related_job_id == job_id).update({Notification.related_job_id: None}, synchronize_session=False)
        db.query(ATSReport).filter(ATSReport.job_id == job_id).delete(synchronize_session=False)
        db.query(Recommendation).filter(Recommendation.job_id == job_id).delete(synchronize_session=False)
        db.query(SwipeHistory).filter(SwipeHistory.job_id == job_id).delete(synchronize_session=False)
        apps = db.query(Application).filter(Application.job_id == job_id).all()
        app_ids = [a.application_id for a in apps]
        if app_ids:
            db.query(Notification).filter(Notification.related_application_id.in_(app_ids)).update({Notification.related_application_id: None}, synchronize_session=False)
            db.query(Application).filter(Application.job_id == job_id).delete(synchronize_session=False)
    except Exception as e:
        print(f"Error cascade deleting job dependents: {e}")

    db.delete(job)
    db.commit()

    return {
        "message": "Job deleted successfully",
        "job_id": job_id
    }

@router.get("/{job_id}/match")
def get_job_match(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get the job
    job = db.query(Job).filter(
        Job.job_id == job_id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

   # Use the latest uploaded resume
    resume = db.query(Resume).filter(
    Resume.user_id == current_user.user_id
    ).order_by(
    Resume.resume_id.desc()
    ).first()

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Please upload a resume first"
        )

    # Read resume PDF
    from pypdf import PdfReader

    try:
        reader = PdfReader(resume.file_path)

        resume_text = ""

        for page in reader.pages:
            text = page.extract_text()

            if text:
                resume_text += text + "\n"

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to read resume: {str(e)}"
        )

    # Build job text
    job_skills = ""

    if isinstance(job.required_skills, list):
        job_skills = " ".join(
            str(skill)
            for skill in job.required_skills
        )

    job_text = f"""
    {job.title}
    {job.description or ""}
    {job.location or ""}
    {job.employment_type or ""}
    {job.experience_required or ""}
    {job_skills}
    """

    # Calculate NLP similarity
    match_score = calculate_job_match(
        resume_text,
        job_text
    )

    return {
        "job_id": job.job_id,
        "resume_id": resume.resume_id,
        "match_score": match_score
    }