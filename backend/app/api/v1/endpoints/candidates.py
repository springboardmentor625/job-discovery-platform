from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_db, get_current_user
from app.core.models import User, CandidateProfile, Resume, Application, Job
from app.core.schemas import CandidateProfileUpdate, CandidateProfileResponse
from app.services.ai.parser import extract_text_from_pdf, extract_full_profile
from app.services.ai.embedder import vector_engine

router = APIRouter()


def calculate_profile_completion(
    profile: CandidateProfile,
    has_resume: bool = False,
) -> int:
    """
    Computes genuine Profile Completion percentage (0% to 100%)
    based strictly on filled candidate profile fields and active master resume:
    - Phone number: 15%
    - Location: 15%
    - Bio / About: 15%
    - Skills (at least 1): 20%
    - Social / Portfolio (LinkedIn & GitHub: 15%, either: 10%)
    - Active Master Resume: 20%
    - Extra parsed Education / Experience: +10% each (as flex/bonus)
    Capped at 100%.
    """
    score = 0
    if profile.phone_number and profile.phone_number.strip():
        score += 15
    if profile.location and profile.location.strip():
        score += 15
    if profile.about_bio and profile.about_bio.strip():
        score += 15
    skills = [s for s in (profile.skills or []) if str(s).strip()]
    if len(skills) > 0:
        score += 20

    has_linkedin = bool(profile.linkedin_url and profile.linkedin_url.strip())
    has_github = bool(profile.github_url and profile.github_url.strip())
    if has_linkedin and has_github:
        score += 15
    elif has_linkedin or has_github:
        score += 10

    if has_resume:
        score += 20

    if profile.education and len(profile.education) > 0:
        score += 10
    if profile.experience and len(profile.experience) > 0:
        score += 10

    return min(100, score)


# Backwards-compatible alias
calculate_health_score = calculate_profile_completion


async def _owned_profile(db: AsyncSession, current_user: User) -> CandidateProfile:
    result = await db.execute(
        select(CandidateProfile).where(CandidateProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found for this account")
    return profile


@router.get("/me", response_model=CandidateProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Not a candidate")
    profile = await _owned_profile(db, current_user)

    resume_result = await db.execute(
        select(Resume).where(Resume.candidate_id == current_user.id)
    )
    resume = resume_result.scalars().first()
    has_resume = resume is not None

    completion = calculate_profile_completion(profile, has_resume=has_resume)
    profile.profile_health_score = completion
    resp = CandidateProfileResponse.model_validate(profile)
    resp.profile_completion = completion
    resp.has_resume = has_resume
    resp.resume_file_url = resume.file_url if resume else None
    return resp


@router.put("/me", response_model=CandidateProfileResponse)
async def update_profile(
    profile_in: CandidateProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Not a candidate")

    profile = await _owned_profile(db, current_user)
    update_data = profile_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)

    resume_result = await db.execute(
        select(Resume).where(Resume.candidate_id == current_user.id)
    )
    resume = resume_result.scalars().first()
    has_resume = resume is not None

    completion = calculate_profile_completion(profile, has_resume=has_resume)
    profile.profile_health_score = completion
    await db.commit()
    await db.refresh(profile)
    resp = CandidateProfileResponse.model_validate(profile)
    resp.profile_completion = completion
    resp.has_resume = has_resume
    resp.resume_file_url = resume.file_url if resume else None
    return resp


@router.post("/resume/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Not a candidate")
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    file_bytes = await file.read()
    raw_text = extract_text_from_pdf(file_bytes)
    extracted_data = extract_full_profile(raw_text)
    ai_skills = extracted_data.get("skills", []) or []

    resume_result = await db.execute(
        select(Resume).where(Resume.candidate_id == current_user.id)
    )
    resume = resume_result.scalars().first()
    file_url = f"/uploads/resumes/{current_user.id}.pdf"
    embedding_vector = vector_engine.get_embedding(raw_text)

    if resume:
        resume.file_url = file_url
        resume.raw_text = raw_text
        resume.embedding = embedding_vector
    else:
        db.add(
            Resume(
                candidate_id=current_user.id,
                file_url=file_url,
                raw_text=raw_text,
                embedding=embedding_vector,
            )
        )

    profile = await _owned_profile(db, current_user)
    existing_skills = set(profile.skills) if profile.skills else set()
    existing_skills.update(ai_skills)
    profile.skills = list(existing_skills)
    if extracted_data.get("phone_number") and not profile.phone_number:
        profile.phone_number = extracted_data["phone_number"]
    if extracted_data.get("linkedin_url") and not profile.linkedin_url:
        profile.linkedin_url = extracted_data["linkedin_url"]
    if extracted_data.get("github_url") and not profile.github_url:
        profile.github_url = extracted_data["github_url"]
    if extracted_data.get("about_bio") and not profile.about_bio:
        profile.about_bio = extracted_data["about_bio"]
    if extracted_data.get("full_name") and not profile.full_name:
        profile.full_name = extracted_data["full_name"]
    profile.profile_health_score = calculate_profile_completion(profile, has_resume=True)

    await db.commit()
    return {
        "success": True,
        "message": "Resume processed successfully",
        "extracted_profile": extracted_data,
        "user_id": str(current_user.id),
    }


@router.get("/dashboard")
async def get_tracking_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Not a candidate")

    query = (
        select(Application, Job)
        .join(Job, Application.job_id == Job.id)
        .where(
            Application.candidate_id == current_user.id,
            Application.swipe_direction == "right",
        )
    )
    result = await db.execute(query)
    applications = result.all()

    dashboard_feed = []
    for app, job in applications:
        dashboard_feed.append({
            "application_id": app.id,
            "job_title": job.title,
            "company_name": job.company_name,
            "location": job.location,
            "status": app.recruiter_status,
            "ats_report": app.ats_report,
            "applied_at": app.created_at,
        })
    return dashboard_feed
