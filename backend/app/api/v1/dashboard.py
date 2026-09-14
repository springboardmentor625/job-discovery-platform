from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, not_
from typing import Any

from app.core.dependencies import get_db, get_current_active_user
from app.models.user import User, UserRole
from app.models.application import Application, ApplicationStatus
from app.models.saved_job import SavedJob
from app.models.profile import Profile
from app.models.job import Job, JobStatus
from app.models.swipe import Swipe
from app.schemas.dashboard import JobSeekerDashboardStats, StatCard, ActivityItem, RecruiterDashboardStats, RecruiterActivityItem
from datetime import datetime

router = APIRouter()

def _format_time_ago(d: datetime) -> str:
    now = datetime.now(d.tzinfo)
    diff = now - d
    days = diff.days
    if days == 0:
        return "Today"
    elif days == 1:
        return "1 day ago"
    else:
        return f"{days} days ago"

@router.get("/job-seeker", response_model=JobSeekerDashboardStats)
def get_job_seeker_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    if current_user.role != UserRole.job_seeker:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only job seekers can access this dashboard.",
        )
        
    user_id = current_user.user_id

    # 1. Stats
    apps = db.query(Application).filter(Application.user_id == user_id).all()
    
    total_apps = len(apps)
    interviews = sum(1 for a in apps if a.status == ApplicationStatus.interview)
    offers = sum(1 for a in apps if a.status == ApplicationStatus.offer)
    rejected = sum(1 for a in apps if a.status == ApplicationStatus.rejected)

    stats = [
        StatCard(label='Applications Sent', value=total_apps, icon='Briefcase', color='text-blue-600', bg='bg-blue-50'),
        StatCard(label='Interviews', value=interviews, icon='Clock', color='text-amber-600', bg='bg-amber-50'),
        StatCard(label='Offers', value=offers, icon='CheckCircle', color='text-green-600', bg='bg-green-50'),
        StatCard(label='Rejected', value=rejected, icon='XCircle', color='text-red-600', bg='bg-red-50'),
    ]

    # 2. Recent Activity (combine applications and saved jobs, take top 5)
    activities = []
    
    recent_apps = db.query(Application).filter(Application.user_id == user_id).order_by(desc(Application.applied_at)).limit(5).all()
    for app in recent_apps:
        activities.append(ActivityItem(
            type="application",
            company=app.job.company_name or "Unknown Company",
            role=app.job.job_title,
            status=app.status.value,
            date=_format_time_ago(app.applied_at)
        ))

    recent_saves = db.query(SavedJob).filter(SavedJob.user_id == user_id).order_by(desc(SavedJob.saved_at)).limit(5).all()
    for save in recent_saves:
        activities.append(ActivityItem(
            type="saved_job",
            company=save.job.company_name or "Unknown Company",
            role=save.job.job_title,
            status="Saved",
            date=_format_time_ago(save.saved_at)
        ))
        
    # Sort by date (assuming we can't perfectly sort strings, but they are limited anyway, we could sort by actual object datetime but this is fine for now, let's keep it simple or not sort them at all as they are two different types. Actually, let's just use recent apps to keep it clean if there are any).
    # To do it properly, fetch objects, sort by date, then map to ActivityItem.
    
    all_raw_activities = []
    for app in recent_apps:
        all_raw_activities.append({"date": app.applied_at, "item": ActivityItem(type="application", company=app.job.company_name or "Company", role=app.job.job_title, status=app.status.value, date=_format_time_ago(app.applied_at))})
    for save in recent_saves:
        all_raw_activities.append({"date": save.saved_at, "item": ActivityItem(type="saved_job", company=save.job.company_name or "Company", role=save.job.job_title, status="Saved", date=_format_time_ago(save.saved_at))})
        
    all_raw_activities.sort(key=lambda x: x["date"], reverse=True)
    recent_activity = [x["item"] for x in all_raw_activities[:5]]

    # 3. Profile Completion
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    completion_percentage = 20 # Base for having an account
    if profile:
        if profile.headline: completion_percentage += 15
        if profile.bio: completion_percentage += 15
        if profile.location: completion_percentage += 10
        if profile.skills and len(profile.skills) > 0: completion_percentage += 20
        if profile.experience_years is not None: completion_percentage += 20
        
    # 4. New Matches Count (Active jobs not swiped)
    swiped_job_ids = [row.job_id for row in db.query(Swipe.job_id).filter(Swipe.user_id == user_id).all()]
    query = db.query(Job).filter(Job.status == JobStatus.active)
    if swiped_job_ids:
        query = query.filter(not_(Job.job_id.in_(swiped_job_ids)))
    new_matches = query.count()

    return JobSeekerDashboardStats(
        stats=stats,
        recent_activity=recent_activity,
        profile_completion_percentage=completion_percentage,
        new_matches_count=new_matches
    )

@router.get("/recruiter", response_model=RecruiterDashboardStats)
def get_recruiter_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    if current_user.role != UserRole.recruiter:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can access this dashboard.",
        )
        
    company = current_user.companies[0] if current_user.companies else None
    
    if not company:
        return RecruiterDashboardStats(
            stats=[
                StatCard(label='Active Jobs', value=0, icon='Briefcase', color='text-blue-600', bg='bg-blue-50'),
                StatCard(label='Total Applicants', value=0, icon='Users', color='text-indigo-600', bg='bg-indigo-50'),
                StatCard(label='Total Views', value=0, icon='Eye', color='text-amber-600', bg='bg-amber-50'),
            ],
            recent_activity=[],
            has_company=False
        )
        
    # Get all jobs for this company
    jobs = db.query(Job).filter(Job.company_id == company.company_id).all()
    job_ids = [j.job_id for j in jobs]
    
    active_jobs = sum(1 for j in jobs if j.status == JobStatus.active)
    total_views = sum(j.views_count for j in jobs)
    total_applicants = sum(j.applicant_count for j in jobs)
    
    stats = [
        StatCard(label='Active Jobs', value=active_jobs, icon='Briefcase', color='text-blue-600', bg='bg-blue-50'),
        StatCard(label='Total Applicants', value=total_applicants, icon='Users', color='text-indigo-600', bg='bg-indigo-50'),
        StatCard(label='Total Views', value=total_views, icon='Eye', color='text-amber-600', bg='bg-amber-50'),
    ]
    
    recent_activity = []
    if job_ids:
        recent_apps = db.query(Application).filter(Application.job_id.in_(job_ids)).order_by(desc(Application.applied_at)).limit(5).all()
        for app in recent_apps:
            # We don't have user's name directly in User model if they didn't set Profile.
            # Let's try to get name from Profile, or fallback to email.
            applicant_name = app.user.email
            if app.user.first_name and app.user.last_name:
                applicant_name = f"{app.user.first_name} {app.user.last_name}"
            elif app.user.first_name:
                applicant_name = app.user.first_name
            recent_activity.append(RecruiterActivityItem(
                type="application",
                applicant_name=applicant_name,
                role=app.job.job_title,
                status=app.status.value,
                date=_format_time_ago(app.applied_at)
            ))
            
    return RecruiterDashboardStats(
        stats=stats,
        recent_activity=recent_activity,
        has_company=True
    )
