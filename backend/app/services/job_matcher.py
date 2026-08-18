"""
Skill-based job matching engine.
Ranks jobs by overlap between user's extracted skills and each job's required skills.
Filters by user's preferred employment type.
"""
from typing import List
from sqlalchemy.orm import Session
from app.models import Job, SwipeHistory, Resume, CandidateProfile
def get_matched_jobs(db: Session, user_id: int, limit: int = 15) -> List[Job]:
    """
    Return jobs sorted by skill relevance for the given user.
    1. Collect user skills from their resume + profile
    2. Get user's preferred job type
    3. Get all active jobs the user hasn't swiped on yet
    4. Filter by preferred employment type
    5. Score each job by (# of matching skills / # of required skills)
    6. Return sorted by score descending
    """
    user_skills_set = set()
    resume = db.query(Resume).filter(Resume.user_id == user_id).first()
    if resume and resume.extracted_skills:
        skills_list = resume.extracted_skills.get("skills", [])
        user_skills_set.update(s.lower().strip() for s in skills_list)
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    if profile and profile.skills:
        for s in profile.skills.split(","):
            user_skills_set.add(s.lower().strip())
    preferred_type = None
    if profile and profile.preferred_job_type:
        preferred_type = profile.preferred_job_type.strip().lower()
    swiped_job_ids = (
        db.query(SwipeHistory.job_id)
        .filter(SwipeHistory.user_id == user_id)
        .all()
    )
    swiped_ids_set = {row[0] for row in swiped_job_ids}
    candidate_jobs = (
        db.query(Job)
        .filter(Job.status == "Active")
        .all()
    )
    candidate_jobs = [j for j in candidate_jobs if j.job_id not in swiped_ids_set]
    if preferred_type:
        type_filtered = [j for j in candidate_jobs if j.employment_type and j.employment_type.strip().lower() == preferred_type]
        if type_filtered:
            candidate_jobs = type_filtered
    if not user_skills_set or not candidate_jobs:
        return candidate_jobs[:limit]
    scored_jobs = []
    for job in candidate_jobs:
        job_skills = []
        if job.required_skills and isinstance(job.required_skills, dict):
            job_skills = job.required_skills.get("skills", [])
        if not job_skills:
            score = 0.0
        else:
            job_skills_lower = {s.lower().strip() for s in job_skills}
            overlap = user_skills_set & job_skills_lower
            score = len(overlap) / len(job_skills_lower)
        scored_jobs.append((score, job))
    scored_jobs.sort(key=lambda x: (-x[0], x[1].job_id))
    return [job for _, job in scored_jobs[:limit]]