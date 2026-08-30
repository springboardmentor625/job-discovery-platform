"""
Skill-based job matching engine.
Ranks jobs by overlap between user's extracted skills and each job's required skills.
Filters by user's preferred employment type.
"""
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models import Job, SwipeHistory, Resume, CandidateProfile, Recommendation

def get_matched_jobs(db: Session, user_id: int, limit: int = 15, offset: int = 0) -> List[Job]:
    """
    Return jobs sorted by deterministic relevance score.
    Persists recommendations in the Recommendation model.
    """
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    resume = db.query(Resume).filter(Resume.user_id == user_id).first()
    
    # 1. Collect User Attributes
    user_skills_set = set()
    if resume and resume.extracted_skills:
        skills_list = resume.extracted_skills.get("skills", [])
        user_skills_set.update(s.lower().strip() for s in skills_list)
    if profile and profile.skills:
        for s in profile.skills.split(","):
            if s.strip():
                user_skills_set.update([s.lower().strip()])
                
    user_experience = profile.experience_years if profile and profile.experience_years else 0
    user_location = profile.city.lower() if profile and profile.city else ""
    user_pref_type = profile.preferred_job_type.lower() if profile and profile.preferred_job_type else ""
    user_role = profile.headline.lower() if profile and profile.headline else ""
    
    # 2. Get unswiped jobs
    swiped_job_ids = db.query(SwipeHistory.job_id).filter(SwipeHistory.user_id == user_id).all()
    swiped_ids_set = {row[0] for row in swiped_job_ids}
    
    active_jobs = db.query(Job).filter(Job.status == "Active").all()
    candidate_jobs = [j for j in active_jobs if j.job_id not in swiped_ids_set]
    
    # 3. Score all unswiped jobs
    scored_jobs = []
    for job in candidate_jobs:
        # Skill Match (50%)
        job_skills = []
        if job.required_skills and isinstance(job.required_skills, dict):
            job_skills = job.required_skills.get("skills", [])
            
        skill_score = 0.0
        matching_skills = []
        if job_skills:
            job_skills_lower = {s.lower().strip() for s in job_skills}
            overlap = user_skills_set.intersection(job_skills_lower)
            matching_skills = list(overlap)
            skill_score = (len(overlap) / len(job_skills_lower)) * 50.0
            
        # Experience Match (20%)
        exp_score = 0.0
        if job.experience_required is not None:
            diff = abs(user_experience - job.experience_required)
            if diff == 0:
                exp_score = 20.0
            elif diff <= 2:
                exp_score = 10.0
        else:
            exp_score = 20.0 # No requirement means match
            
        # Location Match (10%)
        loc_score = 0.0
        if job.location and user_location and user_location in job.location.lower():
            loc_score = 10.0
        elif not job.location:
            loc_score = 10.0
            
        # Employment Type (10%)
        type_score = 0.0
        if job.employment_type and user_pref_type and job.employment_type.lower() == user_pref_type:
            type_score = 10.0
        elif not job.employment_type:
            type_score = 10.0
            
        # Role Fit (10%)
        role_score = 0.0
        if user_role and (user_role in job.title.lower() or job.title.lower() in user_role):
            role_score = 10.0
            
        total_score = skill_score + exp_score + loc_score + type_score + role_score
        
        # Build reason
        reasons = []
        if skill_score > 0:
            reasons.append(f"✓ Skills ({', '.join(matching_skills[:3])})")
        if exp_score >= 10:
            reasons.append("✓ Experience")
        if loc_score == 10 and job.location:
            reasons.append("✓ Location")
            
        reason_str = f"{int(total_score)}% Match. Why this matches: " + ", ".join(reasons)
        if not reasons:
            reason_str = "Explore this opportunity."
            
        scored_jobs.append({
            "job": job,
            "score": total_score,
            "reason": reason_str
        })
        
    # 4. Sort by score
    scored_jobs.sort(key=lambda x: (-x["score"], x["job"].job_id))
    
    # 5. Get paginated window
    paginated = scored_jobs[offset:offset+limit]
    
    # 6. Update Recommendation DB for these jobs
    from app.database import SessionLocal
    # We use the existing session
    for item in paginated:
        job = item["job"]
        rec = db.query(Recommendation).filter(
            Recommendation.user_id == user_id, 
            Recommendation.job_id == job.job_id
        ).first()
        
        if not rec:
            rec = Recommendation(
                user_id=user_id,
                job_id=job.job_id
            )
            db.add(rec)
            
        rec.recommendation_score = item["score"]
        rec.recommendation_reason = item["reason"]
        
        # Inject attributes for Pydantic serialization
        setattr(job, "match_score", item["score"])
        setattr(job, "match_reason", item["reason"])
        
    db.commit()
    
    return [item["job"] for item in paginated]