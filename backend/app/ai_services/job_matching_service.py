from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.job import Job
from app.models.profile import Profile
from app.models.resume import Resume
from app.schemas.job_match import (
    MatchExplanationResponse,
    MatchBreakdown,
    SkillGapResponse,
    SkillPriority
)

def _get_user_skills(db: Session, user_id: str) -> list[str]:
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    resume = db.query(Resume).filter(Resume.user_id == user_id, Resume.is_primary == True).first()
    
    skills = set()
    if profile and profile.skills:
        for s in profile.skills:
            skills.add(s.lower())
    if resume and resume.extracted_skills:
        for s in resume.extracted_skills:
            skills.add(s.lower())
            
    return list(skills)

def _get_job_skills(job: Job) -> list[str]:
    if not job.required_skills:
        return []
    return [s.lower() for s in job.required_skills]

def get_match_explanation(db: Session, user_id: str, job_id: str) -> MatchExplanationResponse:
    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    user_skills = _get_user_skills(db, user_id)
    job_skills = _get_job_skills(job)
    
    # 1. Skills Match
    matched_skills = [s for s in job_skills if s in user_skills]
    missing_skills = [s for s in job_skills if s not in user_skills]
    
    skills_match = int((len(matched_skills) / len(job_skills) * 100)) if job_skills else 100
    
    # 2. Experience Match
    experience_match = 100
    if job.experience_required and profile:
        if profile.experience_years >= job.experience_required:
            experience_match = 100
        else:
            experience_match = int((profile.experience_years / job.experience_required) * 100)
    elif job.experience_required and not profile:
        experience_match = 0
            
    # 3. Location Match
    location_match = 50
    if job.location and profile and profile.location:
        if profile.location.lower() in job.location.lower() or job.location.lower() in profile.location.lower():
            location_match = 100
        elif 'remote' in job.location.lower():
            location_match = 100
            
    # 4. Resume Keyword Match (Mocked for now as we don't have full NLP parsing of JDs)
    resume = db.query(Resume).filter(Resume.user_id == user_id, Resume.is_primary == True).first()
    resume_keyword_match = 80 if resume else 0
    
    # 5. Preference Match (Derived from location/salary expectations)
    preference_match = 50
    if profile and profile.expected_salary and job.salary_min:
        if profile.expected_salary <= job.salary_max:
            preference_match = 100
        else:
            preference_match = 70
            
    # Overall Score (Weighted)
    overall_score = int(
        (skills_match * 0.4) + 
        (experience_match * 0.2) + 
        (location_match * 0.15) + 
        (preference_match * 0.1) + 
        (resume_keyword_match * 0.15)
    )
    
    strengths = []
    improvement_areas = []
    
    if skills_match >= 80:
        strengths.append(f"Strong technical alignment with {len(matched_skills)} matching skills.")
    elif skills_match < 50:
        improvement_areas.append("Significant skill gaps identified for this role.")
        
    if experience_match == 100:
        strengths.append("Meets or exceeds experience requirements.")
    else:
        improvement_areas.append(f"Requires more experience (needs {job.experience_required} years).")
        
    if location_match == 100:
        strengths.append("Location preferences align well.")
        
    explanation = f"You are a {overall_score}% match for {job.job_title}. "
    if strengths:
        explanation += "Your strengths include: " + ", ".join(strengths).lower() + ". "
    if improvement_areas:
        explanation += "Areas to improve: " + ", ".join(improvement_areas).lower() + "."

    return MatchExplanationResponse(
        job_id=job.job_id,
        overall_match_score=overall_score,
        breakdown=MatchBreakdown(
            skills_match=skills_match,
            experience_match=experience_match,
            location_match=location_match,
            preference_match=preference_match,
            resume_keyword_match=resume_keyword_match
        ),
        matched_skills=[s.title() for s in matched_skills],
        missing_skills=[s.title() for s in missing_skills],
        strengths=strengths,
        improvement_areas=improvement_areas,
        explanation=explanation
    )


def analyze_skill_gap(db: Session, user_id: str, job_id: str) -> SkillGapResponse:
    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    user_skills = _get_user_skills(db, user_id)
    job_skills = _get_job_skills(job)
    
    matched_skills = [s.title() for s in job_skills if s in user_skills]
    missing_raw = [s for s in job_skills if s not in user_skills]
    
    skill_match_percentage = int((len(matched_skills) / len(job_skills) * 100)) if job_skills else 100
    
    missing_skills = []
    for idx, skill in enumerate(missing_raw):
        # Determine priority (simple logic: first few are high priority)
        priority = "low"
        if idx < 2:
            priority = "high"
        elif idx < 4:
            priority = "medium"
            
        missing_skills.append(SkillPriority(
            skill=skill.title(),
            priority=priority
        ))
        
    rec = "Your skills perfectly match the requirements!"
    if missing_skills:
        top_missing = [m.skill for m in missing_skills if m.priority == 'high']
        if top_missing:
            rec = f"Learning {', '.join(top_missing)} could significantly improve your compatibility with this role."
        else:
            rec = "Consider picking up some of the missing skills to strengthen your profile."
            
    return SkillGapResponse(
        job_id=job.job_id,
        skill_match_percentage=skill_match_percentage,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        recommendation=rec
    )
