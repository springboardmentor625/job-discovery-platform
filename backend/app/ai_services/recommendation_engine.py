from sqlalchemy.orm import Session
from sqlalchemy import not_
from app.models.job import Job, JobStatus
from app.models.swipe import Swipe, SwipeType
from app.models.saved_job import SavedJob
from app.models.application import Application
from app.models.profile import Profile
from app.models.resume import Resume
from app.schemas.job import JobRecommendation, Job as JobSchema
from collections import Counter


def _calc_match(job: Job, user_skills: list[str]) -> tuple[int, list[str], list[str]]:
    required = [s.lower() for s in (job.required_skills or [])]
    user = [s.lower() for s in (user_skills or [])]

    if not required:
        return 70, [], []

    matched = [s for s in required if s in user]
    missing = [s for s in required if s not in user]

    base_score = int(len(matched) / len(required) * 100)
    score = max(40, base_score)
    return score, matched, missing


def get_job_recommendations(db: Session, user_id: str, skip: int = 0, limit: int = 50) -> list[JobRecommendation]:
    """
    Adaptive Swipe Intelligence Engine.
    Learns from swipes, saved jobs, and applications to dynamically score and rank jobs.
    """
    # 1. Fetch user interactions
    swipes = db.query(Swipe).filter(Swipe.user_id == user_id).all()
    saved_jobs = db.query(SavedJob).filter(SavedJob.user_id == user_id).all()
    applications = db.query(Application).filter(Application.user_id == user_id).all()

    # Exclude jobs already swiped (right or left) or applied to
    swiped_job_ids = {s.job_id for s in swipes}
    applied_job_ids = {a.job_id for a in applications}
    exclude_ids = swiped_job_ids.union(applied_job_ids)

    # 2. Extract preferences
    positive_skills = Counter()
    positive_locations = Counter()
    negative_skills = Counter()
    
    # Process Swipes
    for s in swipes:
        job = s.job
        if not job: continue
        skills = [sk.lower() for sk in (job.required_skills or [])]
        loc = job.location.lower() if job.location else None
        
        if s.swipe_type == SwipeType.right:
            for sk in skills: positive_skills[sk] += 1
            if loc: positive_locations[loc] += 1
        elif s.swipe_type == SwipeType.left:
            for sk in skills: negative_skills[sk] += 1

    # Process Saved Jobs (Strong Positive)
    for sj in saved_jobs:
        job = sj.job
        if not job: continue
        for sk in (job.required_skills or []):
            positive_skills[sk.lower()] += 2
        if job.location:
            positive_locations[job.location.lower()] += 2

    # Process Applications (Very Strong Positive)
    for app in applications:
        job = app.job
        if not job: continue
        for sk in (job.required_skills or []):
            positive_skills[sk.lower()] += 3
        if job.location:
            positive_locations[job.location.lower()] += 3

    # 3. Get user skills from profile/resume
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    resume = db.query(Resume).filter(Resume.user_id == user_id, Resume.is_primary == True).first()
    
    user_skills = set()
    if profile and profile.skills:
        for s in profile.skills: user_skills.add(s.lower())
    if resume and resume.extracted_skills:
        for s in resume.extracted_skills: user_skills.add(s.lower())
    user_skills_list = list(user_skills)

    # 4. Fetch available jobs
    query = db.query(Job).filter(Job.status == JobStatus.active)
    if exclude_ids:
        query = query.filter(not_(Job.job_id.in_(exclude_ids)))
        
    available_jobs = query.all()

    # 5. Score and rank jobs
    recommendations = []
    for job in available_jobs:
        match_percentage, matched, missing = _calc_match(job, user_skills_list)
        
        # Base score starts with the skill match
        recommendation_score = match_percentage
        reasons = []
        
        if match_percentage >= 80:
            reasons.append("Strong skill compatibility")
            
        # Add intelligence weighting
        job_skills = [sk.lower() for sk in (job.required_skills or [])]
        job_loc = job.location.lower() if job.location else None
        
        # Positive Preference
        pos_pref_score = sum(positive_skills.get(sk, 0) for sk in job_skills)
        if pos_pref_score > 5:
            recommendation_score += 15
            reasons.append("Similar to jobs you liked or applied to")
        elif pos_pref_score > 0:
            recommendation_score += 5
            
        # Negative Preference
        neg_pref_score = sum(negative_skills.get(sk, 0) for sk in job_skills)
        if neg_pref_score > 5:
            recommendation_score -= 15
            
        # Location Preference
        if job_loc and positive_locations.get(job_loc, 0) > 2:
            recommendation_score += 10
            reasons.append("Matches your preferred location")
            
        # Normalize score
        recommendation_score = max(0, min(100, recommendation_score))
        
        if not reasons:
            reasons.append("Based on your general profile")
            
        rec = JobRecommendation(
            job=JobSchema.model_validate(job),
            match_percentage=match_percentage,
            matched_skills=matched,
            missing_skills=missing,
            recommendation_score=recommendation_score,
            reasons=reasons,
            recommendation_reason="; ".join(reasons)
        )
        recommendations.append(rec)

    # Sort by adaptive score, then fallback to match percentage
    recommendations.sort(key=lambda x: (x.recommendation_score, x.match_percentage), reverse=True)
    
    # Paginate
    return recommendations[skip:skip+limit]
