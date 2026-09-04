import re
import time
from functools import lru_cache

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Job,
    CandidateProfile,
    JobSwipe,
    SavedJob,
    Resume
)
from ..auth import get_current_user
from ..services.resume_parser import categorize_skills
from ..services.skill_utils import split_skills
from ..services.embeddings import semantic_similarity
from ..services.ats_service import guess_job_category
import joblib
from pathlib import Path


router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs"]
)

SWIPE_MODEL_PATH = Path(__file__).resolve().parents[1] / "ml_models" / "swipe_classifier.joblib"
SWIPE_CLASSIFIER = joblib.load(SWIPE_MODEL_PATH) if SWIPE_MODEL_PATH.exists() else None

# ==========================================
# Minimum swipe count before the trained
# personalization model is trusted for a
# candidate. Counts EVERY swipe regardless of
# direction (right/left both count — see
# swipe_history query below, which has no
# .filter(action=...)). Strictly MORE than this
# number is required, not equal to it — five
# swipes is not enough, six is.
# ==========================================

MIN_SWIPES_FOR_PERSONALIZATION = 5

# Short-lived per-user recommendation cache. Matching thousands of imported
# jobs is the expensive part of this endpoint; the frontend can request the
# same recommendations repeatedly while navigating between dashboards.
# The cache is explicitly invalidated whenever profile/resume/swipe data changes.
RECOMMENDATION_CACHE_TTL_SECONDS = 30
_RECOMMENDATION_CACHE = {}


def invalidate_recommendation_cache(user_id=None):
    """Invalidate one candidate's recommendations, or the entire cache."""
    if user_id is None:
        _RECOMMENDATION_CACHE.clear()
        return
    _RECOMMENDATION_CACHE.pop(user_id, None)


def _get_cached_recommendations(user_id):
    entry = _RECOMMENDATION_CACHE.get(user_id)
    if not entry:
        return None
    if time.monotonic() - entry["created_at"] > RECOMMENDATION_CACHE_TTL_SECONDS:
        _RECOMMENDATION_CACHE.pop(user_id, None)
        return None
    return entry["jobs"]


def _cache_recommendations(user_id, jobs):
    _RECOMMENDATION_CACHE[user_id] = {
        "created_at": time.monotonic(),
        "jobs": jobs,
    }
    return jobs


# ==========================================
# HELPER: CONVERT SKILLS TO SET
# ==========================================

@lru_cache(maxsize=50000)
def skills_to_set(skills):

    if not skills:
        return set()

    return split_skills(skills)


# ==========================================
# HELPER: GET JOB SKILLS
# ==========================================

def get_job_skills(job):

    return skills_to_set(
        job.skills
    )


# ==========================================
# HELPER: EXTRACT SALARY NUMBERS
# ==========================================

@router.get("")
def get_jobs(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # ======================================
    # PLAIN JOB LISTING — GET /api/jobs
    #
    # This is "Discover": active jobs not yet
    # swiped by the current candidate, with no
    # AI scoring or personalization. Sorted
    # newest-first.
    #
    # This is intentionally NOT the same as
    # GET /api/recommendations/{user_id}
    # (AI Recommendations page), which scores
    # and ranks jobs against a specific
    # candidate's profile, resume, and swipe
    # history. Discover shows what's available;
    # AI Recommendations shows what fits.
    # ======================================

    # Discover is candidate-specific: once a job has been swiped,
    # it must not come back when the page is refreshed.
    swiped_job_ids = db.query(JobSwipe.job_id).filter(
        JobSwipe.user_id == user_id
    )
    saved_job_ids = db.query(SavedJob.job_id).filter(
        SavedJob.user_id == user_id
    )

    jobs = (
        db.query(Job)
        .filter(
            Job.status == "active",
            ~Job.job_id.in_(swiped_job_ids),
            ~Job.job_id.in_(saved_job_ids),
        )
        .order_by(Job.created_at.desc())
        .all()
    )


    return [

        {

            "job_id":
                job.job_id,

            "title":
                job.title,

            "company":
                job.company,

            "description":
                job.description,

            "location":
                job.location,

            "employment_type":
                job.employment_type,

            "experience_required":
                job.experience_required,

            "salary":
                job.salary,

            "skills":
                job.skills,

            "created_at":
                job.created_at

        }

        for job in jobs

    ]


@lru_cache(maxsize=50000)
def cached_job_category(title, description):
    return guess_job_category(title or "", description or "")


# ==========================================
# GET MATCHED JOBS FOR CANDIDATE
# ==========================================

# ==========================================
# GET MATCHED JOBS FOR CANDIDATE
#
# Not exposed as its own route anymore — the
# frontend never calls GET /api/jobs/matched
# directly. Kept as a plain function because
# recommendation_routes.py and ats_routes.py
# both call it internally to reuse the scoring
# logic rather than duplicating it.
# ==========================================

@lru_cache(maxsize=2048)
def build_candidate_text(*parts):
    """Build candidate text once per distinct profile/resume content."""
    return " ".join(part for part in parts if part)


def get_matched_jobs(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Build the candidate/job match list using the fixed SwipeX weights:
      70% skills + 20% experience + 10% role relevance.

    Performance design:
    - Candidate text/experience are prepared once.
    - Skill/experience/role scoring is cheap and runs for active jobs.
    - Semantic embeddings are only calculated for the top 200 cheap matches.
    - Job embeddings are cached by the embeddings service.
    - Swipe history is used for personalization/ranking, not for changing
      the 70/20/10 Match %.
    """

    cached_recommendations = _get_cached_recommendations(user_id)
    if cached_recommendations is not None:
        # Return a shallow copy so callers cannot accidentally mutate the cache.
        return [dict(job) for job in cached_recommendations]

    profile = (
        db.query(CandidateProfile)
        .filter(CandidateProfile.user_id == user_id)
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found",
        )

    resume = (
        db.query(Resume)
        .filter(
            Resume.user_id == user_id,
            Resume.is_primary == True,
        )
        .order_by(Resume.uploaded_at.desc())
        .first()
    )

    profile_skills = skills_to_set(profile.skills)
    resume_skills = skills_to_set(resume.extracted_skills) if resume else set()
    candidate_skills = profile_skills | resume_skills

    # Cache candidate text by its source values so repeated recommendation
    # requests do not rebuild the same large resume/profile string.
    candidate_text = build_candidate_text(
        profile.headline or "",
        profile.bio or "",
        profile.skills or "",
        profile.experience or "",
        profile.education or "",
        profile.preferred_role or "",
        resume.extracted_text if resume else "",
    )

    candidate_experience_text = " ".join(
        part
        for part in [
            profile.experience,
            resume.extracted_experience if resume else "",
            resume.extracted_text if resume else "",
        ]
        if part
    ).lower()

    candidate_year_matches = re.findall(
        r"(\d+(?:\.\d+)?)\s*(?:\+\s*)?(?:years?|yrs?)",
        candidate_experience_text,
    )
    candidate_years = (
        max(float(value) for value in candidate_year_matches)
        if candidate_year_matches
        else None
    )

    candidate_role = profile.preferred_role or profile.headline or ""
    candidate_category = cached_job_category(candidate_role, "")

    swipe_history = (
        db.query(JobSwipe)
        .filter(JobSwipe.user_id == user_id)
        .all()
    )

    # ======================================
    # STRICT GATE — both profile (checked above)
    # AND more than MIN_SWIPES_FOR_PERSONALIZATION
    # swipes (any direction, right or left both
    # count — no .filter(action=...) above) are
    # now REQUIRED before any recommendations are
    # generated at all. This is a hard block, not
    # a fallback: fewer swipes means no job list
    # is returned, rather than returning one
    # scored without the trained personalization
    # model.
    # ======================================

    if len(swipe_history) <= MIN_SWIPES_FOR_PERSONALIZATION:
        raise HTTPException(
            status_code=403,
            detail=(
                f"Swipe on more than {MIN_SWIPES_FOR_PERSONALIZATION} jobs in "
                f"Discover before AI Recommendations can be generated. "
                f"You've swiped on {len(swipe_history)} so far."
            ),
        )

    liked_job_ids = {
        swipe.job_id for swipe in swipe_history if swipe.action == "like"
    }
    rejected_job_ids = {
        swipe.job_id for swipe in swipe_history if swipe.action == "reject"
    }

    liked_job_skills = set()
    rejected_job_skills = set()

    if liked_job_ids:
        for skills in (
            db.query(Job.skills)
            .filter(Job.job_id.in_(liked_job_ids))
            .all()
        ):
            liked_job_skills.update(skills_to_set(skills[0]))

    if rejected_job_ids:
        for skills in (
            db.query(Job.skills)
            .filter(Job.job_id.in_(rejected_job_ids))
            .all()
        ):
            rejected_job_skills.update(skills_to_set(skills[0]))

    # Fetch only unswiped active jobs. SQL performs the filtering.
    jobs = (
        db.query(Job)
        .filter(
            Job.status == "active",
            ~Job.job_id.in_(
                db.query(JobSwipe.job_id).filter(
                    JobSwipe.user_id == user_id
                )
            ),
        )
        .all()
    )

    matched_jobs = []

    # First pass: cheap deterministic scoring only.
    for job in jobs:
        job_skills = get_job_skills(job)

        matched_skills = (
            sorted(candidate_skills.intersection(job_skills))
            if candidate_skills and job_skills
            else []
        )

        skill_overlap = (
            len(matched_skills) / len(job_skills) * 100
            if job_skills
            else 0.0
        )

        job_experience_text = (job.experience_required or "").lower()
        job_year_matches = re.findall(
            r"(\d+(?:\.\d+)?)\s*(?:-|to)\s*(?:\d+(?:\.\d+)?)?\s*(?:years?|yrs?)"
            r"|(?:\d+(?:\.\d+)?)\s*\+\s*(?:years?|yrs?)"
            r"|(?:\d+(?:\.\d+)?)\s*(?:years?|yrs?)",
            job_experience_text,
        )

        job_year_values = []
        for match in job_year_matches:
            values = [float(value) for value in match if value]
            if values:
                job_year_values.extend(values)

        required_years = min(job_year_values) if job_year_values else None

        if required_years is None or candidate_years is None:
            experience_match = 100.0
        elif candidate_years >= required_years:
            experience_match = 100.0
        else:
            experience_match = max(
                0.0,
                100.0 - ((required_years - candidate_years) * 20.0),
            )

        job_category = cached_job_category(
            job.title,
            job.description,
        )

        # Graduated role relevance instead of a binary 0/100 switch.
        # Exact category is strongest; adjacent career families receive a
        # meaningful partial score; unrelated/unknown roles receive a small
        # residual score rather than an artificial hard zero.
        related_categories = {
            "software": {"data": 75.0},
            "data": {"software": 75.0},
            "design": {"software": 65.0, "marketing": 65.0},
            "marketing": {"design": 65.0, "sales": 70.0},
            "sales": {"marketing": 70.0, "operations": 55.0},
            "finance": {"operations": 60.0},
            "operations": {"finance": 60.0, "sales": 55.0},
            "hr": {"sales": 50.0},
        }

        if candidate_category == job_category:
            role_relevance = 100.0
        else:
            role_relevance = related_categories.get(
                candidate_category, {}
            ).get(job_category, 20.0)

        liked_skill_matches = job_skills.intersection(liked_job_skills)
        rejected_skill_matches = job_skills.intersection(rejected_job_skills)

        positive_ratio = (
            len(liked_skill_matches) / max(len(job_skills), 1)
        )
        negative_ratio = (
            len(rejected_skill_matches) / max(len(job_skills), 1)
        )

        # Rule-based behavior fallback. ML personalization is applied
        # below only to the limited top candidate set.
        swipe_behavior_fit = max(
            0.0,
            min(
                100.0,
                50.0 + positive_ratio * 50.0 - negative_ratio * 50.0,
            ),
        )

        base_score = (
            skill_overlap * 0.70
            + experience_match * 0.20
            + role_relevance * 0.10
        )

        matched_jobs.append({
            "job_id": job.job_id,
            "title": job.title,
            "company": job.company,
            "description": job.description,
            "location": job.location,
            "employment_type": job.employment_type,
            "experience_required": job.experience_required,
            "salary": job.salary,
            "skills": job.skills,
            "match_score": round(base_score, 2),
            "base_match_score": round(base_score, 2),
            "personalization_score": round(swipe_behavior_fit, 2),
            "match_components": {
                "skill_overlap": round(skill_overlap, 2),
                "experience_match": round(experience_match, 2),
                "role_relevance": round(role_relevance, 2),
                "semantic_similarity": 0.0,
                "swipe_behavior_fit": round(swipe_behavior_fit, 2),
            },
            "matched_skills": matched_skills,
            "liked_preference_skills": sorted(liked_skill_matches),
            "rejected_preference_skills": sorted(rejected_skill_matches),
            "created_at": job.created_at,
            "_job_description": job.description or "",
        })

    # Keep semantic/ML work bounded. The 70/20/10 score itself does not
    # depend on semantic similarity, so there is no reason to embed every
    # imported job before ranking.
    matched_jobs.sort(
        key=lambda item: (item["match_score"], item["personalization_score"]),
        reverse=True,
    )

    semantic_candidates = matched_jobs[:25]

    # swipe_history is guaranteed to be > MIN_SWIPES_FOR_PERSONALIZATION
    # here — the hard gate above already enforced it, so this only
    # needs to check that a trained model actually exists.
    if SWIPE_CLASSIFIER is not None:
        for item in semantic_candidates:
            job_skills = skills_to_set(item["skills"])
            semantic_match = semantic_similarity(
                candidate_text,
                item["_job_description"],
            )

            candidate_skill_categories = categorize_skills(
                ", ".join(candidate_skills)
            )
            job_skill_categories = categorize_skills(item["skills"] or "")
            category_match = int(
                bool(candidate_skill_categories & job_skill_categories)
                or candidate_category
                == cached_job_category(item["title"], item["_job_description"])
            )

            feature_vector = [[
                len(item["matched_skills"]),
                len(item["matched_skills"]) / max(len(candidate_skills), 1),
                semantic_match / 100,
                category_match,
            ]]

            swipe_behavior_fit = (
                float(
                    SWIPE_CLASSIFIER.predict_proba(feature_vector)[0][1]
                )
                * 100
            )

            item["match_components"]["semantic_similarity"] = round(
                semantic_match,
                2,
            )
            item["match_components"]["swipe_behavior_fit"] = round(
                swipe_behavior_fit,
                2,
            )
            item["personalization_score"] = round(
                swipe_behavior_fit,
                2,
            )

    # Semantic/ML personalization changes ordering only; it never changes
    # the displayed 70/20/10 Match %.
    matched_jobs.sort(
        key=lambda item: (
            item["match_score"],
            item["personalization_score"],
        ),
        reverse=True,
    )

    for item in matched_jobs:
        item.pop("_job_description", None)

    return _cache_recommendations(user_id, matched_jobs)


# ==========================================
# GET SINGLE JOB
# ==========================================

@router.get("/discovery-status")
def get_discovery_status(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    total_active = db.query(Job).filter(
        Job.status == "active"
    ).count()

    swiped_count = db.query(JobSwipe).filter(
        JobSwipe.user_id == user_id
    ).count()

    liked_count = db.query(JobSwipe).filter(
        JobSwipe.user_id == user_id,
        JobSwipe.action == "like"
    ).count()

    rejected_count = db.query(JobSwipe).filter(
        JobSwipe.user_id == user_id,
        JobSwipe.action == "reject"
    ).count()

    return {
        "total_active_jobs": total_active,
        "your_total_swipes": swiped_count,
        "your_likes": liked_count,
        "your_rejects": rejected_count,
        "remaining_unswiped": total_active - swiped_count
    }

@router.get("/{job_id}")
def get_job(

    job_id: int,

    db: Session = Depends(
        get_db
    )

):

    job = db.query(Job).filter(

        Job.job_id == job_id,

        Job.status == "active"

    ).first()


    if not job:

        raise HTTPException(

            status_code=404,

            detail="Job not found"

        )


    return {

        "job_id":
            job.job_id,

        "title":
            job.title,

        "company":
            job.company,

        "description":
            job.description,

        "location":
            job.location,

        "employment_type":
            job.employment_type,

        "experience_required":
            job.experience_required,

        "salary":
            job.salary,

        "skills":
            job.skills,

        "created_at":
            job.created_at

    }


# ==========================================
# DISCOVER JOBS DIAGNOSTICS (TESTING ONLY)
# Shows exactly why the swipe queue might look
# short: how many active jobs exist vs how many
# you've already swiped.
# ==========================================


@router.delete("/reset-swipes")
def reset_my_swipes(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    deleted = db.query(JobSwipe).filter(
        JobSwipe.user_id == user_id
    ).delete()

    db.commit()

    return {
        "message": "Swipe history cleared.",
        "deleted_count": deleted
    }