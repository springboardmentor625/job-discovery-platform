from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from .database import get_db
from .models import Recommendation, User, Job, Resume, SwipeHistory, Application, CandidateProfile
from .schemas import RecommendationCreate, RecommendationResponse
from .auth import get_current_user
from .matching import calculate_job_match


router = APIRouter(
    prefix="/recommendations",
    tags=["Recommendations"]
)


def normalize_skills(skills_val) -> list[str]:
    """Safely extract clean lowercase skills from lists or strings"""
    if not skills_val:
        return []
    if isinstance(skills_val, list):
        return [str(s).strip() for s in skills_val if str(s).strip()]
    if isinstance(skills_val, str):
        return [s.strip() for s in skills_val.replace(";", ",").split(",") if s.strip()]
    return []


def calculate_recommendation_score(
    user: User,
    job: Job,
    resume: Resume,
    candidate_profile: CandidateProfile,
    db: Session
) -> tuple:
    """
    Calculate a safe, robust recommendation score that combines multiple signals
    and specifically avoids overfitting to sparse swipe history.
    
    Signals & Weights:
    1. Resume Skill & Content Match (35%)
    2. Candidate Profile & Experience (25%)
    3. Adaptive Swipe History (0-15% based on history volume)
    4. Competition & Early Applicant Opportunity (15%)
    5. Freshness & Diversity (10%)
    
    Returns: (score: float, reason: str, matching_skills: list, missing_skills: list)
    """
    
    score = 0.0
    reasons = []
    matching_skills = []
    missing_skills = []
    
    # Check if already applied -> 0 score
    existing_app = db.query(Application).filter(
        and_(
            Application.user_id == user.user_id,
            Application.job_id == job.job_id
        )
    ).first()
    
    if existing_app:
        return 0.0, "Already applied to this job", [], []

    # ==========================================
    # 1. RESUME-JOB MATCHING (35% weight)
    # ==========================================
    resume_skills_list = normalize_skills(resume.extracted_skills) if resume else []
    job_skills_list = normalize_skills(job.required_skills)
    
    if resume:
        try:
            resume_text = ""
            if resume.file_path:
                try:
                    from pypdf import PdfReader
                    reader = PdfReader(resume.file_path)
                    for page in reader.pages:
                        text = page.extract_text()
                        if text:
                            resume_text += text + "\n"
                except Exception:
                    pass
            if not resume_text and resume_skills_list:
                resume_text = " ".join(resume_skills_list)
            
            if resume_text:
                job_text = f"{job.title} {job.description or ''} {' '.join(job_skills_list)}"
                match_score = calculate_job_match(resume_text, job_text)
                resume_score = min((match_score / 100) * 35, 35)
                score += resume_score
                
                if match_score >= 70:
                    reasons.append(f"High ATS compatibility ({match_score:.0f}%)")
                elif match_score >= 45:
                    reasons.append(f"Strong resume match ({match_score:.0f}%)")
            else:
                score += 15.0  # Base credit for having a resume
        except Exception as e:
            score += 15.0
    
    # ==========================================
    # 2. SKILL & PROFILE MATCHING (25% weight)
    # ==========================================
    job_skills_set = set(str(s).lower() for s in job_skills_list)
    resume_skills_set = set(str(s).lower() for s in resume_skills_list)
    
    matched = resume_skills_set.intersection(job_skills_set)
    missing = job_skills_set - resume_skills_set
    matching_skills = list(matched)
    missing_skills = list(missing)
    
    if len(job_skills_set) > 0:
        skill_match_ratio = len(matched) / len(job_skills_set)
        score += skill_match_ratio * 20
        if len(matched) >= 3:
            reasons.append(f"Matches {len(matched)} of your resume skills")
        elif len(matched) >= 1:
            reasons.append(f"Matches key skill: {list(matched)[0]}")
    elif resume:
        score += 10.0

    if candidate_profile:
        profile_fields = [
            candidate_profile.headline,
            candidate_profile.summary,
            candidate_profile.location,
            candidate_profile.experience_years,
        ]
        completed_count = sum(1 for f in profile_fields if f)
        score += (completed_count / len(profile_fields)) * 5
        
        if candidate_profile.location and job.location and candidate_profile.location.lower() in job.location.lower():
            score += 5
            reasons.append("Matches your location preference")
        
        if candidate_profile.preferred_job_type and job.employment_type and candidate_profile.preferred_job_type.lower() in job.employment_type.lower():
            score += 5
            reasons.append("Matches your job type preference")

    # ==========================================
    # 3. ADAPTIVE SWIPE HISTORY (0-15% weight - Anti-Overfitting)
    # ==========================================
    # Fetch swipe history for this user
    all_swipes = db.query(SwipeHistory).filter(SwipeHistory.user_id == user.user_id).all()
    num_swipes = len(all_swipes)

    if num_swipes == 0:
        # 0 Swipes: Rely completely on profile/resume/job relevance (no penalty or bias)
        pass
    else:
        interested_job_ids = {s.job_id for s in all_swipes if s.swipe_action == "Interested"}
        passed_job_ids = {s.job_id for s in all_swipes if s.swipe_action == "Pass"}
        
        # Adaptive weight based on interaction history:
        # Very few swipes (1-3) -> low weight (0.05)
        # 4+ swipes -> moderate weight (up to 0.15)
        swipe_weight = min(0.15, 0.04 + 0.02 * num_swipes)
        
        # Collect skills from interested jobs
        interested_skills = set()
        for s_job in db.query(Job).filter(Job.job_id.in_(interested_job_ids)).all() if interested_job_ids else []:
            if isinstance(s_job.required_skills, list):
                interested_skills.update(str(sk).lower() for sk in s_job.required_skills)
        
        if interested_skills and job_skills_set:
            swipe_matched = job_skills_set.intersection(interested_skills)
            # Add moderate boost without dominating
            swipe_boost = min(len(swipe_matched) * 3, 100) * swipe_weight
            score += swipe_boost
            if len(swipe_matched) >= 2 and num_swipes >= 3:
                reasons.append("Aligns with roles you showed interest in")
        
        # Left swipe (Pass): Never eliminate entire categories, only slight soft deprioritization for the exact job
        if job.job_id in passed_job_ids:
            score = max(score - 10, 20)  # Gentle reduction, never 0

    # ==========================================
    # 4. APPLICANT COMPETITION & EARLY APPLICANT (15% weight)
    # ==========================================
    applicant_count = db.query(func.count(Application.application_id)).filter(
        Application.job_id == job.job_id
    ).scalar() or 0

    if applicant_count < 5:
        score += 15
        reasons.append("Low competition opportunity (early applicant)")
    elif applicant_count <= 15:
        score += 8
    else:
        score += 2

    # ==========================================
    # 5. DIVERSITY & FRESHNESS (10% weight)
    # ==========================================
    from datetime import datetime
    if job.posted_date:
        try:
            now_dt = datetime.now(job.posted_date.tzinfo) if getattr(job.posted_date, 'tzinfo', None) else datetime.now()
            days_old = (now_dt - job.posted_date).days
        except Exception:
            days_old = 0

        if days_old <= 7:
            score += 10
            reasons.append("Recently posted job matching your skills")
        elif days_old <= 21:
            score += 5
    else:
        score += 5

    # ==========================================
    # FINAL SCORE CALCULATION
    # ==========================================
    final_score = min(max(round(score, 1), 10.0), 99.0)
    
    if not reasons:
        if final_score >= 70:
            reasons.append("Strong match with your candidate profile")
        elif final_score >= 50:
            reasons.append("Good match for your skillset")
        else:
            reasons.append("Relevant opportunity to explore")
    
    # Deduplicate and limit reasons to top 3
    unique_reasons = []
    for r in reasons:
        if r not in unique_reasons:
            unique_reasons.append(r)
    
    reason_text = " • ".join(unique_reasons[:3])
    
    return final_score, reason_text, matching_skills, missing_skills


@router.get("/", response_model=list[RecommendationResponse])
def get_recommendations(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized recommendations for the current user.
    
    Safe recommendations that consider:
    - Resume skills & experience
    - Profile information
    - Skill gaps
    - Job preferences
    - Recent applications
    - Swipe history (but not overfitting to it)
    """
    
    # Get user's resume and profile
    resume = db.query(Resume).filter(
        Resume.user_id == current_user.user_id,
        Resume.is_default == True
    ).first()
    
    if not resume:
        # Use latest resume if no default
        resume = db.query(Resume).filter(
            Resume.user_id == current_user.user_id
        ).order_by(Resume.resume_id.desc()).first()
    
    candidate_profile = db.query(CandidateProfile).filter(
        CandidateProfile.user_id == current_user.user_id
    ).first()
    
    # Get all jobs the user has already applied to
    applied_job_ids = db.query(Application.job_id).filter(
        Application.user_id == current_user.user_id
    ).all()
    applied_job_ids = set(job_id[0] for job_id in applied_job_ids)
    
    # Get all jobs
    all_jobs = db.query(Job).all()
    
    # Calculate recommendation scores for all jobs
    recommendations = []
    for job in all_jobs:
        if job.job_id in applied_job_ids:
            continue  # Skip already applied jobs
        
        score, reason, matching_skills, missing_skills = calculate_recommendation_score(
            current_user, job, resume, candidate_profile, db
        )
        
        # Only include jobs with score >= 40 (meaningful recommendations)
        if score >= 40:
            recommendations.append({
                "job": job,
                "score": score,
                "reason": reason,
                "matching_skills": matching_skills,
                "missing_skills": missing_skills
            })
    
    # Sort by score descending
    recommendations.sort(key=lambda x: x["score"], reverse=True)
    
    # Create recommendation records and return top ones
    result = []
    for rec in recommendations[skip:skip+limit]:
        existing = db.query(Recommendation).filter(
            and_(
                Recommendation.user_id == current_user.user_id,
                Recommendation.job_id == rec["job"].job_id
            )
        ).first()
        
        if not existing:
            new_rec = Recommendation(
                user_id=current_user.user_id,
                job_id=rec["job"].job_id,
                recommendation_score=str(rec["score"]),
                recommendation_reason=rec["reason"],
                matching_skills=rec["matching_skills"],
                missing_skills=rec["missing_skills"]
            )
            db.add(new_rec)
            db.commit()
            db.refresh(new_rec)
            result.append(new_rec)
        else:
            existing.recommendation_score = str(rec["score"])
            existing.recommendation_reason = rec["reason"]
            existing.matching_skills = rec["matching_skills"]
            existing.missing_skills = rec["missing_skills"]
            db.commit()
            db.refresh(existing)
            result.append(existing)
    
    return result


@router.post("/refresh", response_model=list[RecommendationResponse])
def refresh_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Force refresh and recompute recommendations for current user"""
    return get_recommendations(skip=0, limit=20, current_user=current_user, db=db)


@router.get("/{job_id}", response_model=RecommendationResponse)
def get_recommendation_for_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recommendation details for a specific job"""
    
    recommendation = db.query(Recommendation).filter(
        and_(
            Recommendation.user_id == current_user.user_id,
            Recommendation.job_id == job_id
        )
    ).first()
    
    if recommendation is None:
        raise HTTPException(
            status_code=404,
            detail="Recommendation not found"
        )
    
    return recommendation
