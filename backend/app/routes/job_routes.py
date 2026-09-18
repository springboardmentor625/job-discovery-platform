import re
import time
import logging
from functools import lru_cache
from datetime import datetime
from collections import OrderedDict

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy import or_
from sqlalchemy.orm import Session, load_only

from ..database import get_db
from ..models import (
    Job,
    CandidateProfile,
    JobSwipe,
    SavedJob,
    Resume
)
from ..auth import get_current_user
from ..services.skill_utils import categorize_skills, split_skills
from ..services.embeddings import semantic_similarity
from ..services.ats_service import guess_job_category
from ..services.candidate_data import build_candidate_data, experience_range_match_score
import joblib
from pathlib import Path


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs"]
)

SWIPE_MODEL_PATH = Path(__file__).resolve().parents[1] / "ml_models" / "swipe_classifier.joblib"


# Graduated role relevance instead of a binary 0/100 switch. Built from
# unordered pairs and expanded in both directions below, so "software is
# related to data" and "data is related to software" can never drift out
# of sync the way a hand-written two-sided dict previously could (e.g.
# "hr" -> "sales" was scored 50.0 while "sales" -> "hr" silently fell
# through to the 20.0 default). Defined once at module import time
# rather than rebuilt on every job in every request.
_ROLE_RELATED_PAIRS = [
    ("software", "data", 75.0),
    ("design", "software", 65.0),
    ("design", "marketing", 65.0),
    ("marketing", "sales", 70.0),
    ("sales", "operations", 55.0),
    ("finance", "operations", 60.0),
    ("operations", "sales", 55.0),
    ("hr", "sales", 50.0),
]

ROLE_RELATED_CATEGORIES = {}
for _cat_a, _cat_b, _score in _ROLE_RELATED_PAIRS:
    ROLE_RELATED_CATEGORIES.setdefault(_cat_a, {})[_cat_b] = _score
    ROLE_RELATED_CATEGORIES.setdefault(_cat_b, {})[_cat_a] = _score


def _load_swipe_classifier():
    """Load the trained swipe-personalization model, if one exists.

    Train it with `python scripts/train_swipe_model.py` from `backend/`
    (requires 10+ historical swipes across at least one like and one
    reject) — see backend/README.md. Loading is deliberately best-effort:
    a missing, corrupted, or version-incompatible model file must never
    prevent the API from starting or serving requests. When the model
    can't be loaded, recommendations simply fall back to the existing
    profile/resume-based scoring (see MIN_SWIPES_FOR_PERSONALIZATION
    below and the `personalization_ready` check further down).
    """
    if not SWIPE_MODEL_PATH.exists():
        return None
    try:
        return joblib.load(SWIPE_MODEL_PATH)
    except Exception:
        logger.exception(
            "Could not load swipe_classifier.joblib at %s — falling back "
            "to profile/resume-based recommendations.",
            SWIPE_MODEL_PATH,
        )
        return None


SWIPE_CLASSIFIER = _load_swipe_classifier()

# ==========================================
# Minimum swipe count before the trained
# personalization model is trusted for a
# candidate. Counts EVERY swipe regardless of
# direction (right/left both count — see
# swipe_history query below, which has no
# .filter(action=...)). Strictly MORE than this
# number is required, not equal to it — ten
# swipes is not enough, 11 is: 0-10 swipes use
# profile/resume-based recommendations, 11+
# swipes switch to personalized recommendations.
# ==========================================

MIN_SWIPES_FOR_PERSONALIZATION = 10
PROFILE_RESUME_WEIGHT = 0.70
SWIPE_PROFILE_WEIGHT = 0.40
SWIPE_BEHAVIOR_WEIGHT = 0.30
EXPERIENCE_WEIGHT = 0.20
ROLE_WEIGHT = 0.10

# ==========================================
# How many top rule-matched candidates get the
# expensive semantic-similarity + Logistic
# Regression pass (Stage 2 of the recommendation
# pipeline). Stage 1 (skill/experience/role rule
# scoring) always runs over every eligible job.
# Adaptive so small datasets get full coverage
# and large ones stay fast — see
# `_semantic_candidate_limit()` below.
#
#   < 500 eligible jobs     -> process all of them
#   500-2000 eligible jobs  -> top 150
#   2000-10000 eligible jobs -> top 250
#   > 10000 eligible jobs   -> top 400
# ==========================================

# Adaptive candidate limit — see _semantic_candidate_limit() below.


def _semantic_candidate_limit(total_eligible_jobs):
    """Keep the semantic/ML pass aggressively bounded for performance.

    The expensive stage is only used to break ties among the strongest
    rule-based matches. Capped tightly so total recommendation time stays
    well under 45 seconds even with large imported job datasets.
    """
    if total_eligible_jobs < 500:
        return total_eligible_jobs
    if total_eligible_jobs <= 2000:
        return 150
    if total_eligible_jobs <= 10000:
        return 250
    return 400


# Short-lived per-user recommendation cache. Matching thousands of imported
# jobs is the expensive part of this endpoint; the frontend can request the
# same recommendations repeatedly while navigating between dashboards.
# The cache is explicitly invalidated whenever profile/resume/swipe data changes.
RECOMMENDATION_CACHE_TTL_SECONDS = 300
_RECOMMENDATION_CACHE = OrderedDict()
_RECOMMENDATION_CACHE_MAX_SIZE = 512


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
    _RECOMMENDATION_CACHE.move_to_end(user_id)
    return entry["jobs"]


def _cache_recommendations(user_id, jobs):
    _RECOMMENDATION_CACHE[user_id] = {
        "created_at": time.monotonic(),
        "jobs": jobs,
    }
    _RECOMMENDATION_CACHE.move_to_end(user_id)
    while len(_RECOMMENDATION_CACHE) > _RECOMMENDATION_CACHE_MAX_SIZE:
        _RECOMMENDATION_CACHE.popitem(last=False)
    return jobs


def calculate_recommendation_score(profile_resume, behavior, experience, role, swipe_count):
    """Apply the product's fixed recommendation formula in one place."""
    if swipe_count > MIN_SWIPES_FOR_PERSONALIZATION:
        return (
            profile_resume * SWIPE_PROFILE_WEIGHT
            + behavior * SWIPE_BEHAVIOR_WEIGHT
            + experience * EXPERIENCE_WEIGHT
            + role * ROLE_WEIGHT
        )
    return profile_resume * PROFILE_RESUME_WEIGHT + experience * EXPERIENCE_WEIGHT + role * ROLE_WEIGHT


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
    limit: int = 100,
    before_created_at: str = None,
    before_job_id: int = None,
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

    limit = max(1, min(limit, 100))

    job_query = db.query(Job).filter(
        Job.status == "active",
        ~Job.job_id.in_(swiped_job_ids),
        ~Job.job_id.in_(saved_job_ids),
    )

    # Cursor pagination avoids offset-skipping when previously swiped jobs
    # disappear from the result set. The ordering is deterministic even when
    # several jobs share the same created_at timestamp.
    if before_created_at and before_job_id is not None:
        try:
            cursor_time = datetime.fromisoformat(before_created_at.replace("Z", "+00:00"))
            if cursor_time.tzinfo is not None:
                cursor_time = cursor_time.replace(tzinfo=None)
            job_query = job_query.filter(
                or_(
                    Job.created_at < cursor_time,
                    (Job.created_at == cursor_time) & (Job.job_id < before_job_id),
                )
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid job cursor")

    jobs = (
        job_query
        .order_by(Job.created_at.desc(), Job.job_id.desc())
        .limit(limit)  # was unbounded — with ~22k active jobs this fetched,
                     # filtered, and serialized every single row on every
                     # Discover page load, which is the real cause of the
                     # multi-second load time. No swipe session gets
                     # through 100 cards anyway; more can be fetched later
                     # via real pagination if that's ever needed.
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


def get_matched_jobs(user_id: int, db: Session):
    """
    Build the candidate/job match list using the fixed SwipeX weights:
      70% skills + 20% experience + 10% role relevance.

    Performance design:
    - Candidate text/experience are prepared once.
    - Skill/experience/role scoring is cheap and runs for all eligible jobs.
    - Semantic embeddings run only for the top adaptive slice (150/250/400
      depending on pool size — see _semantic_candidate_limit()).
    - Job embeddings are cached by the embeddings service.
    - Swipe history is used for personalization/ranking, not for changing
      the 70/20/10 Match %.
    """

    # ======================================
    # BOTH PROFILE AND RESUME ARE REQUIRED
    # before any recommendation is generated.
    # build_candidate_data() quietly returns
    # empty skills/experience/education when
    # either is missing, which previously let
    # a full ranked list get generated from
    # essentially no real signal. Checked before
    # the cache lookup so a since-deleted profile
    # or resume can't be masked by a stale cache.
    # ======================================

    profile_exists = (
        db.query(CandidateProfile.user_id)
        .filter(CandidateProfile.user_id == user_id)
        .first()
        is not None
    )

    resume_exists = (
        db.query(Resume.resume_id)
        .filter(Resume.user_id == user_id, Resume.is_primary == True)  # noqa: E712
        .first()
        is not None
    )

    if not profile_exists or not resume_exists:
        missing = []
        if not profile_exists:
            missing.append("profile")
        if not resume_exists:
            missing.append("resume")

        raise HTTPException(
            status_code=404,
            detail=(
                f"Complete your {' and '.join(missing)} before AI "
                f"Recommendations can be generated. Both are required — "
                f"one alone isn't enough signal for a meaningful match."
            ),
        )

    cached_recommendations = _get_cached_recommendations(user_id)
    if cached_recommendations is not None:
        # Return a shallow copy so callers cannot accidentally mutate the cache.
        return [dict(job) for job in cached_recommendations]

    candidate = build_candidate_data(db, user_id)
    candidate_skills = candidate.skills

    # Cache candidate text by its source values so repeated recommendation
    # requests do not rebuild the same large resume/profile string.
    candidate_text = build_candidate_text(
        candidate.profile_text,
        candidate.resume_text,
    )

    candidate_min_years = candidate.experience_min_years
    candidate_max_years = candidate.experience_max_years

    candidate_role = candidate.preferred_roles or candidate.profile_text
    candidate_category = cached_job_category(candidate_role, "")

    swipe_history = (
        db.query(JobSwipe)
        .filter(JobSwipe.user_id == user_id)
        .all()
    )

    # ======================================
    # SWIPE PERSONALIZATION IS OPTIONAL UNTIL
    # MORE THAN MIN_SWIPES_FOR_PERSONALIZATION.
    #
    # 0-10 swipes:
    #   recommendations are generated directly
    #   from profile + resume.
    #
    # 11+ swipes:
    #   swipe behaviour is added to the ranking
    #   using the trained classifier when available.
    # There is intentionally NO hard gate here.
    # ======================================

    personalization_ready = len(swipe_history) > MIN_SWIPES_FOR_PERSONALIZATION

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
    # Capped at the most recent 3000 active jobs: iterating the full
    # 20k+ imported dataset for rule-based scoring on every cold start
    # was the primary cause of multi-minute first-load times. 3000 is
    # more than enough for strong personalized recommendations —
    # rule scoring + semantic re-ranks the top candidates from this
    # pool, and the cache then serves subsequent requests instantly.
    jobs = (
        db.query(Job)
        .options(
            load_only(
                Job.job_id, Job.title, Job.company, Job.description,
                Job.location, Job.employment_type, Job.experience_required,
                Job.salary, Job.skills, Job.created_at
            )
        )
        .filter(
            Job.status == "active",
            ~Job.job_id.in_(
                db.query(JobSwipe.job_id).filter(
                    JobSwipe.user_id == user_id
                )
            ),
            # A saved job must not be treated as an available AI
            # recommendation candidate — it's already been acted on by
            # the candidate, same as a like/reject. Without this, a
            # saved-but-unswiped job could keep reappearing here after
            # a refresh even though it correctly disappeared from the
            # current deck client-side.
            ~Job.job_id.in_(
                db.query(SavedJob.job_id).filter(
                    SavedJob.user_id == user_id
                )
            ),
        )
        .order_by(Job.created_at.desc())
        .limit(3000)
    )

    matched_jobs = []

    # First pass: cheap deterministic scoring only.
    for job in jobs:
        job_skills = get_job_skills(job)

        if job_skills:
            matched_skills = (
                sorted(candidate_skills.intersection(job_skills))
                if candidate_skills
                else []
            )

            skill_overlap = (
                len(matched_skills) / len(job_skills) * 100
                if job_skills
                else 0.0
            )

        else:
            # ======================================
            # FALLBACK for jobs with no extracted skills
            # (title + description were too vague for
            # dictionary/spaCy/Groq to find anything).
            #
            # Without this, skill_overlap hard-defaults
            # to 0.0, which — at 70% of the formula's
            # weight — makes it mathematically impossible
            # for such a job to ever clear the 40% match
            # threshold, regardless of actual fit. That
            # silently and permanently excludes every job
            # with empty skills from recommendations.
            #
            # This is a cheap plain-text substring check
            # (not a full re-extraction, not an embedding
            # call) — deliberately lightweight since this
            # runs for every job in the candidate's pool,
            # not just the expensive top-N slice.
            # ======================================
            job_text = f"{job.title or ''} {job.description or ''}".lower()

            matched_skills = sorted(
                skill for skill in candidate_skills if skill in job_text
            )

            skill_overlap = (
                min(100.0, len(matched_skills) / max(len(candidate_skills), 1) * 100)
                if candidate_skills
                else 0.0
            )

        experience_match = experience_range_match_score(
            candidate_min_years,
            candidate_max_years,
            job.experience_required,
        )

        job_category = cached_job_category(
            job.title,
            job.description,
        )

        # Graduated role relevance instead of a binary 0/100 switch.
        # Exact category is strongest; adjacent career families receive a
        # meaningful partial score; unrelated/unknown roles receive a small
        # residual score rather than an artificial hard zero.
        # (See ROLE_RELATED_CATEGORIES at module level — it used to be
        # rebuilt here on every single job, and asymmetrically: e.g. hr
        # candidates matched to sales jobs scored 50, but sales candidates
        # matched to hr jobs fell through to the 20 default.)

        if candidate_category is None or job_category is None:
            # Neither side could be classified into any known category —
            # this is a genuine unknown, not a match. Previously this fell
            # through to the equality check below, where None == None
            # silently granted a full 100.0 role_relevance for every
            # unclassifiable job, which was a real contributor to
            # match_score inflation.
            role_relevance = 30.0
        elif candidate_category == job_category:
            role_relevance = 100.0
        else:
            role_relevance = ROLE_RELATED_CATEGORIES.get(
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

        # calculate_recommendation_score() branches internally on
        # swipe_count > MIN_SWIPES_FOR_PERSONALIZATION — 70/20/10 (profile
        # + resume, experience, role) at 10 or fewer swipes, 40/30/20/10
        # (adding swipe behavior) once more than 10 swipes exist.
        # (Previously this was an if/else that called this exact same
        # function with identical arguments in both branches — dead,
        # misleading code that did nothing. The real tiering already
        # happens inside calculate_recommendation_score() itself.)
        base_score = calculate_recommendation_score(
            skill_overlap, swipe_behavior_fit, experience_match,
            role_relevance, len(swipe_history),
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
            "profile_resume_score": round(skill_overlap, 2),
            "experience_match": round(experience_match, 2),
            "role_relevance": round(role_relevance, 2),
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

    # Stage 2 candidate pool: adaptive, not a fixed 200. See
    # `_semantic_candidate_limit()` — small datasets get every job
    # processed with semantic similarity + Logistic Regression; larger
    # ones are capped to keep response times reasonable. The jobs list
    # is already rule-score-sorted above, so this keeps the strongest
    # rule-matched candidates.
    semantic_candidates = matched_jobs[: _semantic_candidate_limit(len(matched_jobs))]

    # The trained swipe model is used only after the user has more than
    # MIN_SWIPES_FOR_PERSONALIZATION swipes. Before that, recommendations
    # remain purely profile + resume based.
    if personalization_ready and SWIPE_CLASSIFIER is not None:
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

            # The model was trained offline against a fixed feature
            # layout (see scripts/train_swipe_model.py). If it was ever
            # retrained with a different sklearn version or a mismatched
            # feature count, predict_proba() can raise — that must not
            # break recommendations for this (or any other) candidate;
            # just skip the personalization boost for this job and keep
            # its existing rule-based score.
            try:
                swipe_behavior_fit = (
                    float(
                        SWIPE_CLASSIFIER.predict_proba(feature_vector)[0][1]
                    )
                    * 100
                )
            except Exception:
                logger.exception(
                    "swipe_classifier.predict_proba failed for job_id=%s — "
                    "skipping personalization boost for this job.",
                    item.get("job_id"),
                )
                continue

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

    # Final ranking.
    # 0-10 swipes: profile/resume-driven 70/20/10 ranking.
    # 11+ swipes: profile/resume 40% + swipe behaviour 30% +
    # experience 20% + role relevance 10%.
    for item in matched_jobs:
        profile_resume = float(item.get("profile_resume_score", 0))
        behavior = float(item.get("personalization_score", 0))
        experience = float(item.get("experience_match", 0))
        role = float(item.get("role_relevance", item.get("category_match", 0)))

        recommendation_score = calculate_recommendation_score(
            profile_resume, behavior, experience, role, len(swipe_history),
        )

        item["recommendation_score"] = round(recommendation_score, 2)

    matched_jobs.sort(
        key=lambda item: item["recommendation_score"],
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

    total_active = db.query(Job).filter(Job.status == "active").count()

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

    # "Remaining" must mirror the same filtering the actual job feed uses —
    # a job the candidate has saved is no longer available to swipe on
    # either (Discover and AI Recommendations both exclude it), so it must
    # not be counted as remaining. Two independent NOT-IN subqueries (swipes,
    # saves) — a job can't be double-subtracted since each check only
    # removes it once regardless of which condition(s) it matches.
    remaining_unswiped = db.query(Job).filter(
        Job.status == "active",
        ~Job.job_id.in_(db.query(JobSwipe.job_id).filter(JobSwipe.user_id == user_id)),
        ~Job.job_id.in_(db.query(SavedJob.job_id).filter(SavedJob.user_id == user_id)),
    ).count()

    return {
        "total_active_jobs": total_active,
        "your_total_swipes": swiped_count,
        "your_likes": liked_count,
        "your_rejects": rejected_count,
        "remaining_unswiped": remaining_unswiped
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
    invalidate_recommendation_cache(user_id)

    return {
        "message": "Swipe history cleared.",
        "deleted_count": deleted
    }