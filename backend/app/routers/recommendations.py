from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func, select

from ..database import get_db

from ..models import (
    User,
    Resume,
    Job,
    CandidateProfile,
    SwipeHistory,
)

from ..utils.security import verify_access_token

from ..ml.predict import predict_job_match


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/recommendations",
    tags=["Recommendations"],
)

security = HTTPBearer()


# =========================================================
# PERFORMANCE SETTINGS
# =========================================================
#
# The database currently contains 55,000+ active jobs.
#
# We DO NOT run the ML model on every job.
#
# Instead:
#
# 1. Fetch a limited pool of recent active jobs
# 2. Remove jobs already swiped by the user
# 3. Apply cheap candidate filtering
# 4. Run ML only on the best candidates
# 5. Return only the top recommendations
#
# =========================================================

INITIAL_JOB_POOL = 5000

ML_CANDIDATE_LIMIT = 300

RECOMMENDATION_LIMIT = 30


# =========================================================
# GET CURRENT USER ID
# =========================================================

def get_current_user_id(
    credentials: HTTPAuthorizationCredentials,
):
    """
    Verify JWT token and return current user ID.
    """

    token = credentials.credentials

    payload = verify_access_token(
        token
    )

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    user_id = payload.get(
        "sub"
    )

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )

    try:

        return int(user_id)

    except (
        TypeError,
        ValueError,
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid user ID in token",
        )


# =========================================================
# NORMALIZE VALUE
# =========================================================

def normalize_value(value):
    """
    Convert a value into a normalized lowercase string.
    """

    if value is None:
        return ""

    return str(value).strip().lower()


# =========================================================
# CALCULATE SKILL MATCH
# =========================================================

def calculate_skill_match(
    resume_skills,
    required_skills,
):
    """
    Compare resume skills with job required skills.

    Used for:
    - Matched skills
    - Missing skills
    - Frontend match breakdown

    This is NOT used as a fixed final recommendation weight.
    """

    resume_skills = resume_skills or []
    required_skills = required_skills or []

    resume_skills_lower = {
        normalize_value(skill)
        for skill in resume_skills
        if normalize_value(skill)
    }

    matched_skills = []
    missing_skills = []

    for skill in required_skills:

        normalized_skill = normalize_value(
            skill
        )

        if not normalized_skill:
            continue

        if normalized_skill in resume_skills_lower:

            matched_skills.append(
                skill
            )

        else:

            missing_skills.append(
                skill
            )

    unique_required_skills = {
        normalize_value(skill)
        for skill in required_skills
        if normalize_value(skill)
    }

    if not unique_required_skills:

        skill_score = 0.0

    else:

        skill_score = (
            len(matched_skills)
            / len(unique_required_skills)
        ) * 100

    return (
        matched_skills,
        missing_skills,
        round(
            skill_score,
            2,
        ),
    )


# =========================================================
# CALCULATE EXPERIENCE MATCH
# =========================================================

def calculate_experience_match(
    candidate_experience,
    required_experience,
):
    """
    Calculate experience compatibility.
    """

    if required_experience is None:
        return 100.0

    try:

        required = float(
            required_experience
        )

    except (
        TypeError,
        ValueError,
    ):

        return 0.0

    if required <= 0:
        return 100.0

    if candidate_experience is None:
        return 0.0

    try:

        candidate = float(
            candidate_experience
        )

    except (
        TypeError,
        ValueError,
    ):

        return 0.0

    if candidate >= required:
        return 100.0

    experience_score = (
        candidate / required
    ) * 100

    return round(
        experience_score,
        2,
    )


# =========================================================
# CALCULATE LOCATION MATCH
# =========================================================

def calculate_location_match(
    preferred_location,
    job_location,
):
    """
    Compare candidate preferred location
    with job location.
    """

    if not preferred_location:
        return 50.0

    if not job_location:
        return 50.0

    preferred = normalize_value(
        preferred_location
    )

    job = normalize_value(
        job_location
    )

    if (
        preferred in job
        or job in preferred
    ):

        return 100.0

    if (
        "remote" in preferred
        and "remote" in job
    ):

        return 100.0

    return 0.0


# =========================================================
# CALCULATE JOB TYPE MATCH
# =========================================================

def calculate_job_type_match(
    preferred_job_type,
    employment_type,
):
    """
    Compare candidate preferred job type
    with job employment type.
    """

    if not preferred_job_type:
        return 50.0

    if not employment_type:
        return 50.0

    preferred = normalize_value(
        preferred_job_type
    )

    job_type = normalize_value(
        employment_type
    )

    if (
        preferred in job_type
        or job_type in preferred
    ):

        return 100.0

    return 0.0


# =========================================================
# CALCULATE DIRECT SWIPE SCORE
# =========================================================

def calculate_swipe_score(
    job_id,
    swipe_history,
):
    """
    Calculate personalization based on direct
    previous interaction with a job.

    Positive:
        RIGHT / SAVE

    Negative:
        LEFT

    Already-swiped jobs are excluded from the
    recommendation candidate pool, so this function
    mainly remains for compatibility with the
    existing scoring architecture.
    """

    if not swipe_history:
        return 0.0

    job_actions = [
        normalize_value(
            swipe.swipe_action
        )
        for swipe in swipe_history
        if swipe.job_id == job_id
    ]

    if not job_actions:
        return 0.0

    latest_action = job_actions[-1]

    if latest_action in {
        "right",
        "save",
        "saved",
        "favorite",
        "favourite",
    }:

        return 10.0

    if latest_action in {
        "left",
        "skip",
    }:

        return -10.0

    return 0.0


# =========================================================
# BUILD SWIPE PREFERENCE DATA
# =========================================================

def build_swipe_preferences(
    swipe_history,
    swiped_jobs,
):
    """
    Build lightweight preference information from
    the user's previous swipe activity.

    Positive interactions:
        RIGHT / SAVE

    Negative interactions:
        LEFT

    These signals are used for candidate filtering
    and later personalization.
    """

    positive_skills = set()
    negative_skills = set()

    positive_title_words = set()
    negative_title_words = set()

    job_map = {
        job.job_id: job
        for job in swiped_jobs
    }

    positive_actions = {
        "right",
        "save",
        "saved",
        "favorite",
        "favourite",
    }

    negative_actions = {
        "left",
        "skip",
    }

    for swipe in swipe_history:

        job = job_map.get(
            swipe.job_id
        )

        if not job:
            continue

        action = normalize_value(
            swipe.swipe_action
        )

        job_skills = {
            normalize_value(skill)
            for skill in (
                job.required_skills or []
            )
            if normalize_value(skill)
        }

        title_words = {
            word
            for word in normalize_value(
                job.title
            ).split()
            if len(word) > 2
        }

        if action in positive_actions:

            positive_skills.update(
                job_skills
            )

            positive_title_words.update(
                title_words
            )

        elif action in negative_actions:

            negative_skills.update(
                job_skills
            )

            negative_title_words.update(
                title_words
            )

    return {
        "positive_skills": positive_skills,
        "negative_skills": negative_skills,
        "positive_title_words": positive_title_words,
        "negative_title_words": negative_title_words,
    }


# =========================================================
# CHEAP CANDIDATE SCORE
# =========================================================

def calculate_candidate_pre_score(
    job,
    resume_skills,
    preferred_location,
    preferred_job_type,
    candidate_experience,
    swipe_preferences,
):
    """
    Cheap pre-filter score.

    IMPORTANT:
    This is NOT the final recommendation score.

    It exists only to decide which jobs deserve
    expensive ML processing.

    Signals:
    - Resume skill overlap
    - Positive swipe skill similarity
    - Negative swipe similarity
    - Title similarity
    - Location compatibility
    - Experience compatibility
    - Job type compatibility
    """

    required_skills = (
        job.required_skills
        or []
    )

    job_skills = {
        normalize_value(skill)
        for skill in required_skills
        if normalize_value(skill)
    }

    resume_skill_set = {
        normalize_value(skill)
        for skill in (
            resume_skills or []
        )
        if normalize_value(skill)
    }

    # -----------------------------------------------------
    # Resume skill overlap
    # -----------------------------------------------------

    resume_overlap = (
        job_skills
        & resume_skill_set
    )

    resume_skill_score = (
        len(resume_overlap)
        / max(
            len(job_skills),
            1,
        )
    ) * 100

    # -----------------------------------------------------
    # Positive swipe similarity
    # -----------------------------------------------------

    positive_skills = swipe_preferences[
        "positive_skills"
    ]

    negative_skills = swipe_preferences[
        "negative_skills"
    ]

    positive_overlap = (
        job_skills
        & positive_skills
    )

    negative_overlap = (
        job_skills
        & negative_skills
    )

    # -----------------------------------------------------
    # Title similarity
    # -----------------------------------------------------

    job_title_words = {
        word
        for word in normalize_value(
            job.title
        ).split()
        if len(word) > 2
    }

    positive_title_words = swipe_preferences[
        "positive_title_words"
    ]

    negative_title_words = swipe_preferences[
        "negative_title_words"
    ]

    positive_title_overlap = (
        job_title_words
        & positive_title_words
    )

    negative_title_overlap = (
        job_title_words
        & negative_title_words
    )

    # -----------------------------------------------------
    # Profile compatibility
    # -----------------------------------------------------

    location_score = calculate_location_match(
        preferred_location,
        job.location,
    )

    experience_score = calculate_experience_match(
        candidate_experience,
        job.experience_required,
    )

    job_type_score = calculate_job_type_match(
        preferred_job_type,
        job.employment_type,
    )

    # -----------------------------------------------------
    # Cheap ranking signal
    #
    # This is intentionally only a candidate-generation
    # score. It is NOT returned to the frontend.
    # -----------------------------------------------------

    score = 0.0

    score += resume_skill_score

    score += (
        len(positive_overlap)
        * 12
    )

    score -= (
        len(negative_overlap)
        * 5
    )

    score += (
        len(positive_title_overlap)
        * 8
    )

    score -= (
        len(negative_title_overlap)
        * 3
    )

    if location_score == 100:
        score += 10

    if experience_score >= 100:
        score += 5

    if job_type_score == 100:
        score += 5

    return round(
        score,
        2,
    )


# =========================================================
# CALCULATE SIMILAR JOB SWIPE SCORE
# =========================================================

def calculate_similar_job_swipe_score(
    job,
    swipe_history,
    swiped_jobs,
):
    """
    Learn a personalization signal from previous
    interactions with similar jobs.

    Similarity is based on:
    - Job title words
    - Required skills
    """

    if not swipe_history:
        return 0.0

    current_title = normalize_value(
        job.title
    )

    current_title_words = {
        word
        for word in current_title.split()
        if len(word) > 2
    }

    current_skills = {
        normalize_value(skill)
        for skill in (
            job.required_skills or []
        )
        if normalize_value(skill)
    }

    job_map = {
        item.job_id: item
        for item in swiped_jobs
    }

    positive_signals = 0
    negative_signals = 0

    positive_actions = {
        "right",
        "save",
        "saved",
        "favorite",
        "favourite",
    }

    negative_actions = {
        "left",
        "skip",
    }

    for swipe in swipe_history:

        previous_job = job_map.get(
            swipe.job_id
        )

        if not previous_job:
            continue

        if previous_job.job_id == job.job_id:
            continue

        previous_title_words = {
            word
            for word in normalize_value(
                previous_job.title
            ).split()
            if len(word) > 2
        }

        previous_skills = {
            normalize_value(skill)
            for skill in (
                previous_job.required_skills
                or []
            )
            if normalize_value(skill)
        }

        title_similarity = bool(
            current_title_words
            & previous_title_words
        )

        skill_similarity = bool(
            current_skills
            & previous_skills
        )

        if not (
            title_similarity
            or skill_similarity
        ):
            continue

        action = normalize_value(
            swipe.swipe_action
        )

        if action in positive_actions:

            positive_signals += 1

        elif action in negative_actions:

            negative_signals += 1

    total_signals = (
        positive_signals
        + negative_signals
    )

    if total_signals == 0:
        return 0.0

    preference_ratio = (
        positive_signals
        - negative_signals
    ) / total_signals

    score = preference_ratio * 5

    return round(
        score,
        2,
    )


# =========================================================
# GENERATE RECOMMENDATION REASON
# =========================================================

def generate_recommendation_reason(
    matched_skills,
    missing_skills,
    skill_score,
    experience_score,
    location_score,
    job_type_score,
    ml_score,
    swipe_score,
):
    """
    Generate a human-readable explanation.
    """

    reasons = []

    # -----------------------------------------------------
    # ML
    # -----------------------------------------------------

    if ml_score >= 80:

        reasons.append(
            "the ML model predicts a strong resume-job match"
        )

    elif ml_score >= 60:

        reasons.append(
            "the ML model predicts a good resume-job match"
        )

    elif ml_score >= 40:

        reasons.append(
            "the ML model predicts a moderate resume-job match"
        )

    else:

        reasons.append(
            "the ML model predicts a lower resume-job match"
        )

    # -----------------------------------------------------
    # Skills
    # -----------------------------------------------------

    if skill_score >= 80:

        reasons.append(
            f"{len(matched_skills)} of the required skills "
            "match your resume"
        )

    elif skill_score >= 50:

        reasons.append(
            f"{len(matched_skills)} of the required skills "
            "match your resume"
        )

    elif skill_score > 0:

        reasons.append(
            f"{len(matched_skills)} required skill(s) "
            "match your resume"
        )

    # -----------------------------------------------------
    # Experience
    # -----------------------------------------------------

    if experience_score >= 100:

        reasons.append(
            "your experience meets the requirement"
        )

    elif experience_score >= 50:

        reasons.append(
            "your experience partially matches"
        )

    # -----------------------------------------------------
    # Location
    # -----------------------------------------------------

    if location_score == 100:

        reasons.append(
            "the location matches your preference"
        )

    # -----------------------------------------------------
    # Job Type
    # -----------------------------------------------------

    if job_type_score == 100:

        reasons.append(
            "the employment type matches your preference"
        )

    # -----------------------------------------------------
    # Swipe personalization
    # -----------------------------------------------------

    if swipe_score > 0:

        reasons.append(
            "your previous swipe activity shows "
            "interest in similar opportunities"
        )

    elif swipe_score < 0:

        reasons.append(
            "your previous swipe activity indicates "
            "lower interest in similar opportunities"
        )

    return (
        "Recommended because "
        + ", ".join(reasons)
        + "."
    )


# =========================================================
# GET RECOMMENDED JOBS
# =========================================================

@router.get("/")
def get_recommended_jobs(

    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),

    db: Session = Depends(get_db),
):
    """
    Generate personalized job recommendations.

    OPTIMIZED FLOW:

        Resume
           |
           v
      Candidate Profile
           |
           v
      Swipe History
           |
           v
      Exclude Already Swiped Jobs
           |
           v
      Initial Job Pool
           |
           v
      Cheap Candidate Filtering
           |
           v
      Top ML Candidates
           |
           v
      Trained ML Model
           |
           v
      Swipe Personalization
           |
           v
      Final Recommendation Score
           |
           v
      Top 30 Jobs
    """

    # =====================================================
    # 1. VERIFY USER
    # =====================================================

    user_id = get_current_user_id(
        credentials
    )

    user = (
        db.query(User)
        .filter(
            User.user_id == user_id
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # =====================================================
    # 2. GET CANDIDATE PROFILE
    # =====================================================

    candidate_profile = (
        db.query(CandidateProfile)
        .filter(
            CandidateProfile.user_id
            == user_id
        )
        .first()
    )

    # =====================================================
    # 3. GET DEFAULT RESUME
    # =====================================================

    resume = (
        db.query(Resume)
        .filter(
            Resume.user_id == user_id,
            Resume.is_default == True,
        )
        .order_by(
            Resume.uploaded_at.desc()
        )
        .first()
    )

    # =====================================================
    # 4. FALLBACK TO LATEST RESUME
    # =====================================================

    if not resume:

        resume = (
            db.query(Resume)
            .filter(
                Resume.user_id == user_id
            )
            .order_by(
                Resume.uploaded_at.desc()
            )
            .first()
        )

    # =====================================================
    # 5. CHECK RESUME
    # =====================================================

    if not resume:

        raise HTTPException(
            status_code=404,
            detail=(
                "No resume found. "
                "Please upload a resume first."
            ),
        )

    # =====================================================
    # 6. GET RESUME SKILLS
    # =====================================================

    resume_skills = (
        resume.extracted_skills
        or []
    )

    # =====================================================
    # 7. GET RESUME TEXT
    # =====================================================

    resume_text = (
        resume.resume_text
        or ""
    )

    if not resume_text:

        resume_text = " ".join(
            str(skill)
            for skill in resume_skills
        )

    # =====================================================
    # 8. GET CANDIDATE PREFERENCES
    # =====================================================

    candidate_experience = None
    preferred_location = None
    preferred_job_type = None

    if candidate_profile:

        candidate_experience = (
            candidate_profile.experience_years
        )

        preferred_location = (
            candidate_profile.preferred_location
            or candidate_profile.location
        )

        preferred_job_type = (
            candidate_profile.preferred_job_type
        )

    # =====================================================
    # 9. GET SWIPE HISTORY
    # =====================================================

    swipe_history = (
        db.query(SwipeHistory)
        .filter(
            SwipeHistory.user_id == user_id
        )
        .order_by(
            SwipeHistory.swiped_at.asc()
        )
        .all()
    )

    # =====================================================
    # 10. GET ALREADY SWIPED JOB IDS
    # =====================================================

    swiped_job_ids = {
        swipe.job_id
        for swipe in swipe_history
        if swipe.job_id is not None
    }

    # =====================================================
    # 11. GET JOBS REFERENCED BY SWIPE HISTORY
    # =====================================================
    #
    # We only load jobs the user actually interacted with.
    #
    # This is much smaller than loading all 55,000 jobs.
    #
    # =====================================================

    swiped_jobs = []

    if swiped_job_ids:

        swiped_jobs = (
            db.query(Job)
            .filter(
                Job.job_id.in_(
                    swiped_job_ids
                )
            )
            .all()
        )

    # =====================================================
    # 12. BUILD SWIPE PREFERENCES
    # =====================================================

    swipe_preferences = (
        build_swipe_preferences(
            swipe_history,
            swiped_jobs,
        )
    )

    # =====================================================
    # 13. GET INITIAL ACTIVE JOB POOL
    # =====================================================
    #
    # IMPORTANT:
    #
    # We do NOT fetch every active job.
    #
    # The previous implementation loaded all 55,000+
    # jobs and ran ML against each one.
    #
    # Now we:
    #
    # - only fetch recent active jobs
    # - exclude jobs already processed by the user
    # - use a maximum initial pool
    #
    # =====================================================

    job_query = (
        db.query(Job)
        .filter(
            func.upper(Job.status) == "ACTIVE"
        )
    )

    if swiped_job_ids:

        job_query = job_query.filter(
            ~Job.job_id.in_(
                select(
                    SwipeHistory.job_id
                ).where(
                    SwipeHistory.user_id
                    == user_id
                )
            )
        )

    jobs = (
        job_query
        .order_by(
            Job.posted_date.desc()
        )
        .limit(
            INITIAL_JOB_POOL
        )
        .all()
    )

    # =====================================================
    # 14. CHECK AVAILABLE JOBS
    # =====================================================

    if not jobs:

        return {
            "user_id":
                user_id,

            "resume_id":
                resume.resume_id,

            "resume_skills":
                resume_skills,

            "candidate_profile_used":
                candidate_profile is not None,

            "swipe_history_used":
                len(swipe_history) > 0,

            "ml_model_used":
                True,

            "recommendations":
                [],

            "count":
                0,
        }

    # =====================================================
    # 15. CHEAP CANDIDATE FILTERING
    # =====================================================
    #
    # No ML is used here.
    #
    # This stage is intentionally fast.
    #
    # =====================================================

    candidate_jobs = []

    for job in jobs:

        pre_score = (
            calculate_candidate_pre_score(
                job=job,
                resume_skills=resume_skills,
                preferred_location=preferred_location,
                preferred_job_type=preferred_job_type,
                candidate_experience=candidate_experience,
                swipe_preferences=swipe_preferences,
            )
        )

        candidate_jobs.append(
            (
                pre_score,
                job,
            )
        )

    # =====================================================
    # 16. SORT CHEAP CANDIDATES
    # =====================================================

    candidate_jobs.sort(
        key=lambda item:
            item[0],
        reverse=True,
    )

    # =====================================================
    # 17. KEEP ONLY TOP ML CANDIDATES
    # =====================================================
    #
    # Example:
    #
    # 5,000 jobs
    #      ↓
    # cheap filtering
    #      ↓
    # 300 jobs
    #      ↓
    # ML
    #
    # =====================================================

    candidate_jobs = candidate_jobs[
        :ML_CANDIDATE_LIMIT
    ]

    # =====================================================
    # 18. PROCESS ML CANDIDATES
    # =====================================================

    recommendations = []

    for (
        pre_score,
        job,
    ) in candidate_jobs:

        required_skills = (
            job.required_skills
            or []
        )

        # -------------------------------------------------
        # Skill match
        # -------------------------------------------------

        (
            matched_skills,
            missing_skills,
            skill_score,
        ) = calculate_skill_match(
            resume_skills,
            required_skills,
        )

        # -------------------------------------------------
        # Experience match
        # -------------------------------------------------

        experience_score = (
            calculate_experience_match(
                candidate_experience,
                job.experience_required,
            )
        )

        # -------------------------------------------------
        # Location match
        # -------------------------------------------------

        location_score = (
            calculate_location_match(
                preferred_location,
                job.location,
            )
        )

        # -------------------------------------------------
        # Job type match
        # -------------------------------------------------

        job_type_score = (
            calculate_job_type_match(
                preferred_job_type,
                job.employment_type,
            )
        )

        # =================================================
        # CREATE JOB TEXT FOR ML
        # =================================================

        job_text_parts = [
            job.title or "",
            job.description or "",
            job.location or "",
            job.employment_type or "",
            " ".join(
                str(skill)
                for skill in required_skills
            ),
        ]

        if job.experience_required is not None:

            job_text_parts.append(
                str(
                    job.experience_required
                )
            )

        job_text = " ".join(
            part
            for part in job_text_parts
            if part
        )

        # =================================================
        # ML MATCH
        # =================================================

        try:

            ml_match_percentage = (
                predict_job_match(
                    resume_text,
                    job_text,
                )
            )

        except Exception as error:

            print(
                "ML prediction error:",
                error,
            )

            ml_match_percentage = 0.0

        ml_match_percentage = round(
            max(
                0.0,
                min(
                    100.0,
                    float(
                        ml_match_percentage
                    ),
                ),
            ),
            2,
        )

        # =================================================
        # SWIPE PERSONALIZATION
        # =================================================

        direct_swipe_score = (
            calculate_swipe_score(
                job.job_id,
                swipe_history,
            )
        )

        similar_job_swipe_score = (
            calculate_similar_job_swipe_score(
                job,
                swipe_history,
                swiped_jobs,
            )
        )

        swipe_adjustment = (
            direct_swipe_score
            + similar_job_swipe_score
        )

        swipe_adjustment = round(
            max(
                -10.0,
                min(
                    10.0,
                    swipe_adjustment,
                ),
            ),
            2,
        )

        # =================================================
        # FINAL RECOMMENDATION SCORE
        # =================================================
        #
        # ML remains the primary compatibility score.
        #
        # Swipe history remains personalization.
        #
        # No old 60/20/10/10 formula.
        #
        # =================================================

        recommendation_score = (
            ml_match_percentage
            + swipe_adjustment
        )

        recommendation_score = max(
            0.0,
            min(
                100.0,
                recommendation_score,
            ),
        )

        recommendation_score = round(
            recommendation_score,
            2,
        )

        # =================================================
        # RECOMMENDATION REASON
        # =================================================

        recommendation_reason = (
            generate_recommendation_reason(
                matched_skills,
                missing_skills,
                skill_score,
                experience_score,
                location_score,
                job_type_score,
                ml_match_percentage,
                swipe_adjustment,
            )
        )

        # =================================================
        # ADD RECOMMENDATION
        # =================================================

        recommendations.append(
            {
                "job_id":
                    job.job_id,

                "company_id":
                    job.company_id,

                "title":
                    job.title,

                "description":
                    job.description,

                "location":
                    job.location,

                "employment_type":
                    job.employment_type,

                "salary_min":
                    job.salary_min,

                "salary_max":
                    job.salary_max,

                "experience_required":
                    job.experience_required,

                "required_skills":
                    required_skills,

                "matched_skills":
                    matched_skills,

                "missing_skills":
                    missing_skills,

                "skill_match_percentage":
                    skill_score,

                "experience_match_percentage":
                    experience_score,

                "location_match_percentage":
                    location_score,

                "job_type_match_percentage":
                    job_type_score,

                "ml_match_percentage":
                    ml_match_percentage,

                "swipe_adjustment":
                    swipe_adjustment,

                "recommendation_score":
                    recommendation_score,

                "recommendation_reason":
                    recommendation_reason,
            }
        )

    # =====================================================
    # 19. SORT FINAL RECOMMENDATIONS
    # =====================================================

    recommendations.sort(
        key=lambda job:
            job["recommendation_score"],
        reverse=True,
    )

    # =====================================================
    # 20. RETURN TOP RECOMMENDATIONS
    # =====================================================

    recommendations = recommendations[
        :RECOMMENDATION_LIMIT
    ]

    # =====================================================
    # 21. RETURN RESPONSE
    # =====================================================

    return {
        "user_id":
            user_id,

        "resume_id":
            resume.resume_id,

        "resume_skills":
            resume_skills,

        "candidate_profile_used":
            candidate_profile is not None,

        "swipe_history_used":
            len(swipe_history) > 0,

        "ml_model_used":
            True,

        "recommendations":
            recommendations,

        "count":
            len(recommendations),
    }
