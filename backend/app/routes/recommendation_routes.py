import re

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Job, JobSwipe
from ..auth import get_current_user
from .job_routes import get_matched_jobs, invalidate_recommendation_cache
router = APIRouter(
    tags=["Recommendations"]
)


def compute_tags(job):

    tags = []

    location_text = (job.get("location") or "").lower()
    employment_text = (job.get("employment_type") or "").lower()

    # --------------------------------------
    # REMOTE
    # --------------------------------------

    if "remote" in location_text or "remote" in employment_text:
        tags.append("Remote")

    # --------------------------------------
    # COMPANY TYPE (only if explicitly set
    # on the job — most imported test data
    # won't have this populated)
    # --------------------------------------

    if job.get("company_type"):
        tags.append(job["company_type"])

    # --------------------------------------
    # FRESHNESS
    # --------------------------------------

    created_at = job.get("created_at")

    if created_at:

        age_days = (datetime.utcnow() - created_at).days

        if age_days <= 7:
            tags.append("New")

    # --------------------------------------
    # FRESHER FRIENDLY
    # --------------------------------------

    experience_text = (job.get("experience_required") or "").lower()

    if re.search(r"\b0\s*year", experience_text) or any(
        keyword in experience_text
        for keyword in ("fresher", "entry", "no experience")
    ):
        tags.append("Fresher-friendly")

    return tags


# ==========================================
# GET RECOMMENDATIONS (ENRICHED)
# Reuses the existing /api/jobs/matched
# scoring logic and enriches it with the
# extra fields the Discover page needs.
# ==========================================

@router.get("/api/recommendations/{user_id}")
def get_recommendations(
    user_id: int,
    limit: int = 50,
    search: str = None,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if user_id != current_user_id:

        raise HTTPException(
            status_code=403,
            detail="You can only view your own recommendations"
        )

    # Guard against pathological limit values from the client.
    limit = max(1, min(limit, 300))

    matched_jobs = get_matched_jobs(
        user_id=current_user_id,
        db=db
    )

    # ======================================
    # PERFORMANCE CAP
    #
    # get_matched_jobs can return every active
    # job in the database (the imported Naukri dataset).
    # Enriching every one
    # of them below (word-overlap regex per
    # description, tag computation, etc.) does
    # not scale — the Discover page only ever
    # needs the top handful for Swipe Deck /
    # Recommended, and a generously large pool
    # for Search & Filters. matched_jobs is
    # already sorted by match_score descending,
    # so this keeps the best matches and avoids
    # doing real work on jobs nobody will see.
    # ======================================

    matched_jobs = matched_jobs[:200]

    # ======================================
    # OPTIONAL SERVER-SIDE SEARCH
    # Applied BEFORE slicing/enriching so the
    # Search & Filters mode can search beyond
    # whatever the current page's limit is,
    # without shipping/enriching the entire
    # (potentially thousands-strong) job list.
    # ======================================

    if search:

        query = search.strip().lower()

        matched_jobs = [
            job
            for job in matched_jobs
            if query in " ".join(
                filter(
                    None,
                    [
                        job["title"],
                        job["company"],
                        job["skills"],
                        job["location"]
                    ]
                )
            ).lower()
        ]

    # ======================================
    # BOUND THE EXPENSIVE WORK
    # matched_jobs is already sorted by
    # match_score (highest first) — only the
    # jobs we're actually about to return get
    # the (comparatively expensive) enrichment
    # pass below, not the full active-jobs
    # table.
    # ======================================

    matched_jobs = matched_jobs[:limit]

    # ======================================
    # ENRICH EACH JOB (bounded to `limit`)
    # ======================================

    enriched_jobs = []

    for job in matched_jobs:

        required_skills = [
            skill.strip()
            for skill in (job["skills"] or "").split(",")
            if skill.strip()
        ]

        components = job.get("match_components", {})
        skill_overlap = components.get("skill_overlap", 0.0)
        semantic_match = components.get("semantic_similarity", 0.0)
        swipe_behavior_fit = components.get("swipe_behavior_fit", 0.0)


        enriched_jobs.append({
            **job,
            "required_skills": required_skills,
            "posted_date": job["created_at"],
            "tags": compute_tags(job),
            "score_breakdown": {
                "skill_overlap": skill_overlap,
                "semantic_match": semantic_match,
                "swipe_behavior_fit": swipe_behavior_fit,
            }
        })

    return enriched_jobs


# ==========================================
# SWIPE (right / left)
# Separate endpoint/contract from the
# existing /api/jobs/{id}/swipe (like/reject)
# used by the Discover grid, kept for the
# Swipe Deck mode's contract. Both write to
# the same job_swipes table, so a job swiped
# in either mode is excluded from future
# recommendations either way.
# ==========================================

class SwipeInput(BaseModel):
    job_id: int
    action: str  # "right" or "left"
    match_score: float | None = None


ACTION_MAP = {
    "right": "like",
    "left": "reject"
}


@router.post("/api/swipes")
def record_swipe(
    data: SwipeInput,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if data.action not in ACTION_MAP:

        raise HTTPException(
            status_code=400,
            detail="action must be 'right' or 'left'"
        )

    job = db.query(Job).filter(
        Job.job_id == data.job_id,
        Job.status == "active"
    ).first()

    if not job:

        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    # ======================================
    # LOOK UP CURRENT MATCH SCORE
    # (job is still unswiped at this point,
    # so it will be present in the matched
    # list if the candidate has a profile)
    # ======================================

    # The card already contains the authoritative match score returned by
    # the recommendation endpoint. Reusing it avoids recalculating the full
    # candidate/job matching pipeline on every swipe, which is expensive for
    # a large imported job dataset. Older/API-only clients can omit it and
    # the backend will fall back to calculating it.
    match_score = data.match_score

    if match_score is None:
        try:
            matched_jobs = get_matched_jobs(
                user_id=user_id,
                db=db
            )

            for matched_job in matched_jobs:
                if matched_job["job_id"] == data.job_id:
                    match_score = matched_job["match_score"]
                    break

        except HTTPException:
            # No candidate profile yet — swipe can still be recorded,
            # just without a score.
            match_score = None

    internal_action = ACTION_MAP[data.action]

    existing_swipe = db.query(JobSwipe).filter(
        JobSwipe.user_id == user_id,
        JobSwipe.job_id == data.job_id
    ).first()

    if existing_swipe:

        existing_swipe.action = internal_action
        existing_swipe.match_score = match_score

        db.commit()
        db.refresh(existing_swipe)
        invalidate_recommendation_cache(user_id)

        return {
            "message": "Swipe updated successfully",
            "swipe_id": existing_swipe.swipe_id,
            "job_id": existing_swipe.job_id,
            "action": data.action
        }

    swipe = JobSwipe(
        user_id=user_id,
        job_id=data.job_id,
        action=internal_action,
        match_score=match_score
    )

    db.add(swipe)
    db.commit()
    db.refresh(swipe)
    invalidate_recommendation_cache(user_id)

    return {
        "message": "Swipe saved successfully",
        "swipe_id": swipe.swipe_id,
        "job_id": swipe.job_id,
        "action": data.action
    }


@router.get("/api/swipes/history")
def get_swipe_history(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    swipes = (
        db.query(JobSwipe, Job)
        .join(Job, Job.job_id == JobSwipe.job_id)
        .filter(JobSwipe.user_id == user_id)
        .order_by(JobSwipe.created_at.desc())
        .all()
    )

    return [
        {
            "swipe_id": swipe.swipe_id,
            "job_id": swipe.job_id,
            "action": swipe.action,
            "match_score": swipe.match_score,
            "created_at": swipe.created_at,
            "title": job.title,
            "company": job.company,
            "description": job.description,
            "location": job.location,
            "employment_type": job.employment_type,
            "experience_required": job.experience_required,
            "salary": job.salary,
            "skills": job.skills,
        }
        for swipe, job in swipes
    ]
