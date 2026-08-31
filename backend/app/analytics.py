from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta


from .database import get_db
from .models import Application, SwipeHistory, Resume, Recommendation, Job, User
from .schemas import AnalyticsDashboardResponse
from .auth import get_current_user


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
