from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta


from .database import get_db
from .models import Application, SwipeHistory, Resume, Recommendation, Job, User
from .schemas import AnalyticsDashboardResponse, RecruiterAnalyticsResponse
from .auth import get_current_user, require_role
from .applications import compute_or_get_job_match_score


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@router.get("/dashboard", response_model=AnalyticsDashboardResponse)
def get_analytics_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Compute rich, fully dynamic analytics for the candidate dashboard.
    """
    # 1. Applications
    applications = db.query(Application).filter(
        Application.user_id == current_user.user_id
    ).all()
    
    total_applications = len(applications)
    applied_count = sum(1 for a in applications if a.status in ["Applied", None])
    shortlisted_count = sum(1 for a in applications if a.status == "Shortlisted")
    selected_count = sum(1 for a in applications if a.status == "Selected")
    rejected_count = sum(1 for a in applications if a.status == "Rejected")

    positive_responses = shortlisted_count + selected_count
    all_responses = positive_responses + rejected_count
    response_rate = round((all_responses / total_applications * 100), 1) if total_applications > 0 else 0.0
    interview_rate = round((positive_responses / total_applications * 100), 1) if total_applications > 0 else 0.0

    # 2. Swipe History
    swipes = db.query(SwipeHistory).filter(
        SwipeHistory.user_id == current_user.user_id
    ).all()
    total_swipes = len(swipes)
    interested_count = sum(1 for s in swipes if s.swipe_action == "Interested")
    passed_count = sum(1 for s in swipes if s.swipe_action == "Pass")

    # 3. Resumes & ATS Scores
    resumes = db.query(Resume).filter(
        Resume.user_id == current_user.user_id
    ).all()
    resumes_count = len(resumes)
    ats_scores = [r.ats_score for r in resumes if r.ats_score is not None]
    avg_ats_score = round(sum(ats_scores) / len(ats_scores), 1) if ats_scores else 0.0

    # 4. Recommendations
    recommendations = db.query(Recommendation).filter(
        Recommendation.user_id == current_user.user_id
    ).all()
    recommendations_count = len(recommendations)
    rec_scores = []
    for r in recommendations:
        try:
            rec_scores.append(float(r.recommendation_score))
        except (ValueError, TypeError):
            pass
    avg_recommendation_score = round(sum(rec_scores) / len(rec_scores), 1) if rec_scores else 0.0

    # 5. Skill Gaps Analysis (aggregate missing skills from recommendations / target jobs)
    skill_gap_counts = {}
    for r in recommendations:
        if r.missing_skills and isinstance(r.missing_skills, list):
            for skill in r.missing_skills:
                s_clean = str(skill).strip()
                if s_clean:
                    skill_gap_counts[s_clean] = skill_gap_counts.get(s_clean, 0) + 1

    if not skill_gap_counts:
        user_skills = set()
        for res in resumes:
            if res.extracted_skills and isinstance(res.extracted_skills, list):
                user_skills.update(str(s).lower() for s in res.extracted_skills)
        for job in db.query(Job).all():
            if job.required_skills and isinstance(job.required_skills, list):
                for skill in job.required_skills:
                    if str(skill).lower() not in user_skills:
                        skill_gap_counts[str(skill)] = skill_gap_counts.get(str(skill), 0) + 1

    skill_gaps = [
        {"skill": k, "frequency": v}
        for k, v in sorted(skill_gap_counts.items(), key=lambda x: x[1], reverse=True)[:6]
    ]

    # 6. Status distribution for chart
    status_distribution = [
        {"name": "Applied", "value": applied_count, "color": "#3b82f6"},
        {"name": "Shortlisted", "value": shortlisted_count, "color": "#f59e0b"},
        {"name": "Selected", "value": selected_count, "color": "#10b981"},
        {"name": "Rejected", "value": rejected_count, "color": "#ef4444"},
    ]

    # 7. Application trends (last 7 days)
    application_trends = []
    now = datetime.now(timezone.utc)
    for i in range(6, -1, -1):
        day_date = now - timedelta(days=i)
        day_str = day_date.strftime("%Y-%m-%d")
        day_label = day_date.strftime("%b %d")
        count = sum(1 for a in applications if a.applied_at and a.applied_at.strftime("%Y-%m-%d") == day_str)
        application_trends.append({
            "date": day_label,
            "applications": count
        })


    return {
        "total_applications": total_applications,
        "applied_count": applied_count,
        "shortlisted_count": shortlisted_count,
        "selected_count": selected_count,
        "rejected_count": rejected_count,
        "interested_count": interested_count,
        "passed_count": passed_count,
        "total_swipes": total_swipes,
        "response_rate": response_rate,
        "interview_rate": interview_rate,
        "avg_ats_score": avg_ats_score,
        "resumes_count": resumes_count,
        "recommendations_count": recommendations_count,
        "avg_recommendation_score": avg_recommendation_score,
        "skill_gaps": skill_gaps,
        "status_distribution": status_distribution,
        "application_trends": application_trends
    }


@router.get("/recruiter", response_model=RecruiterAnalyticsResponse)
def get_recruiter_analytics(
    current_user: User = Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    """Compute recruitment statistics exclusively for the authenticated recruiter's dashboard."""
    jobs = db.query(Job).filter(
        Job.recruiter_id == current_user.user_id
    ).all()

    total_jobs = len(jobs)
    active_jobs = sum(1 for j in jobs if (j.status or "").lower() in ["active", "open", "published"])

    job_ids = [j.job_id for j in jobs]

    applications = db.query(Application).filter(
        Application.job_id.in_(job_ids)
    ).all() if job_ids else []

    total_applicants = len(applications)
    shortlisted_applicants = sum(1 for a in applications if a.status in ["Shortlisted", "Selected", "Offered", "Interview"])

    applied_count = sum(1 for a in applications if a.status in ["Applied", None])
    shortlisted_count = sum(1 for a in applications if a.status == "Shortlisted")
    interview_count = sum(1 for a in applications if a.status == "Interview")
    selected_count = sum(1 for a in applications if a.status in ["Selected", "Offered"])
    rejected_count = sum(1 for a in applications if a.status == "Rejected")

    status_distribution = [
        {"name": "Applied", "value": applied_count, "color": "#3b82f6"},
        {"name": "Shortlisted", "value": shortlisted_count, "color": "#f59e0b"},
        {"name": "Interview", "value": interview_count, "color": "#8b5cf6"},
        {"name": "Selected", "value": selected_count, "color": "#10b981"},
        {"name": "Rejected", "value": rejected_count, "color": "#ef4444"},
    ]

    recent_apps = db.query(Application).filter(
        Application.job_id.in_(job_ids)
    ).order_by(Application.applied_at.desc()).limit(6).all() if job_ids else []

    recent_applications = []
    for app in recent_apps:
        cand = db.query(User).filter(User.user_id == app.user_id).first()
        j = db.query(Job).filter(Job.job_id == app.job_id).first()
        res = db.query(Resume).filter(Resume.resume_id == app.resume_id).first() if app.resume_id else None
        
        match_score, _, _, _, _ = compute_or_get_job_match_score(res, j, db) if res and j else (None, [], [], None, False)
        
        recent_applications.append({
            "application_id": app.application_id,
            "candidate_name": cand.full_name if cand else "Candidate",
            "candidate_email": cand.email if cand else "",
            "job_title": j.title if j else "Job",
            "status": app.status or "Applied",
            "applied_at": app.applied_at.isoformat() if app.applied_at else "",
            "ats_score": match_score if match_score is not None else (res.ats_score if res else None),
            "resume_match_score": match_score
        })

    skill_counts = {}
    for j in jobs:
        if isinstance(j.required_skills, list):
            for s in j.required_skills:
                skill_counts[str(s)] = skill_counts.get(str(s), 0) + 1

    top_skills = [
        {"skill": k, "count": v}
        for k, v in sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:6]
    ]

    return {
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "total_applicants": total_applicants,
        "shortlisted_applicants": shortlisted_applicants,
        "recent_applications": recent_applications,
        "status_distribution": status_distribution,
        "top_skills": top_skills
    }
