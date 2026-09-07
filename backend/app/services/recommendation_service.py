import re
from typing import Any, Dict, List, Optional, Set


# =========================================================
# TEXT NORMALIZATION
# =========================================================

def normalize_text(value: Any) -> str:
    """
    Convert a value to normalized lowercase text.
    """

    if value is None:
        return ""

    if isinstance(value, list):
        value = " ".join(
            str(item)
            for item in value
        )

    if isinstance(value, dict):
        value = " ".join(
            str(item)
            for item in value.values()
        )

    value = str(value).lower()

    value = re.sub(
        r"[^a-z0-9+#.\-/ ]+",
        " ",
        value
    )

    value = re.sub(
        r"\s+",
        " ",
        value
    )

    return value.strip()


# =========================================================
# NORMALIZE SKILL
# =========================================================

def normalize_skill(skill: Any) -> str:
    """
    Normalize an individual skill for comparison.
    """

    return normalize_text(skill)


# =========================================================
# CONVERT SKILLS TO SET
# =========================================================

def skills_to_set(skills: Any) -> Set[str]:
    """
    Convert a list/string/dict of skills into a normalized set.
    """

    if not skills:
        return set()

    if isinstance(skills, list):

        return {
            normalize_skill(skill)
            for skill in skills
            if normalize_skill(skill)
        }

    if isinstance(skills, dict):

        return {
            normalize_skill(value)
            for value in skills.values()
            if normalize_skill(value)
        }

    if isinstance(skills, str):

        # Handle comma-separated skills
        parts = re.split(
            r"[,;\n|]",
            skills
        )

        return {
            normalize_skill(skill)
            for skill in parts
            if normalize_skill(skill)
        }

    return set()


# =========================================================
# EXTRACT SKILLS FROM JOB
# =========================================================

def extract_job_skills(job) -> Set[str]:
    """
    Extract required skills from the Job model.

    Primary source:
        job.required_skills

    Also uses job title and description as supporting text.
    """

    skills = set()

    # -----------------------------------------------------
    # Required skills from database
    # -----------------------------------------------------

    if job.required_skills:

        skills.update(
            skills_to_set(
                job.required_skills
            )
        )

    return skills


# =========================================================
# EXTRACT RESUME SKILLS
# =========================================================

def extract_resume_skills(resume) -> Set[str]:
    """
    Extract candidate skills from the uploaded resume.
    """

    if not resume:
        return set()

    return skills_to_set(
        resume.extracted_skills
    )


# =========================================================
# SKILL MATCH SCORE
# =========================================================

def calculate_skill_match(
    candidate_skills: Set[str],
    job_skills: Set[str],
) -> Dict[str, Any]:
    """
    Calculate skill-based matching.

    Returns:
        matched_skills
        missing_skills
        score
    """

    if not job_skills:

        return {
            "matched_skills": [],
            "missing_skills": [],
            "score": 0.0,
        }

    matched_skills = (
        candidate_skills
        & job_skills
    )

    missing_skills = (
        job_skills
        - candidate_skills
    )

    score = (
        len(matched_skills)
        / len(job_skills)
    ) * 100

    return {
        "matched_skills": sorted(
            matched_skills
        ),

        "missing_skills": sorted(
            missing_skills
        ),

        "score": round(
            score,
            2
        ),
    }


# =========================================================
# LOCATION MATCH
# =========================================================

def calculate_location_match(
    candidate_profile,
    job,
) -> float:
    """
    Calculate location compatibility.

    Priority:
        preferred_location
        candidate location

    A remote job is considered compatible
    with the candidate location.
    """

    job_location = normalize_text(
        job.location
    )

    preferred_location = normalize_text(
        getattr(
            candidate_profile,
            "preferred_location",
            None
        )
    )

    candidate_location = normalize_text(
        getattr(
            candidate_profile,
            "location",
            None
        )
    )

    if not job_location:
        return 50.0

    if "remote" in job_location:
        return 100.0

    if preferred_location:

        if (
            preferred_location in job_location
            or job_location in preferred_location
        ):
            return 100.0

    if candidate_location:

        if (
            candidate_location in job_location
            or job_location in candidate_location
        ):
            return 100.0

    # Location exists but does not match.
    return 0.0


# =========================================================
# JOB TYPE MATCH
# =========================================================

def calculate_job_type_match(
    candidate_profile,
    job,
) -> float:
    """
    Compare candidate preferred job type
    with job employment type.
    """

    preferred_type = normalize_text(
        getattr(
            candidate_profile,
            "preferred_job_type",
            None
        )
    )

    job_type = normalize_text(
        getattr(
            job,
            "employment_type",
            None
        )
    )

    if not preferred_type or not job_type:
        return 50.0

    if (
        preferred_type == job_type
        or preferred_type in job_type
        or job_type in preferred_type
    ):
        return 100.0

    return 0.0


# =========================================================
# EXPERIENCE MATCH
# =========================================================

def calculate_experience_match(
    candidate_profile,
    job,
) -> float:
    """
    Compare candidate experience with
    required job experience.

    If either value is unavailable,
    a neutral score of 50 is returned.
    """

    candidate_experience = getattr(
        candidate_profile,
        "experience_years",
        None
    )

    required_experience = getattr(
        job,
        "experience_required",
        None
    )

    if (
        candidate_experience is None
        or required_experience is None
    ):
        return 50.0

    try:

        candidate_experience = float(
            candidate_experience
        )

        required_experience = float(
            required_experience
        )

    except (
        TypeError,
        ValueError
    ):

        return 50.0

    if candidate_experience >= required_experience:
        return 100.0

    if required_experience == 0:
        return 100.0

    # Partial score when candidate has
    # less experience than required.
    score = (
        candidate_experience
        / required_experience
    ) * 100

    return round(
        min(score, 100.0),
        2
    )


# =========================================================
# TITLE / RESUME TEXT MATCH
# =========================================================

def calculate_text_match(
    resume,
    job,
) -> float:
    """
    Check whether important words from the
    job title appear in the candidate resume.

    This is a lightweight text matching component.
    """

    if not resume:
        return 0.0

    resume_text = normalize_text(
        getattr(
            resume,
            "resume_text",
            ""
        )
    )

    job_title = normalize_text(
        getattr(
            job,
            "title",
            ""
        )
    )

    if not resume_text or not job_title:
        return 0.0

    job_words = set(
        job_title.split()
    )

    # Ignore very common words.
    ignored_words = {
        "and",
        "or",
        "the",
        "a",
        "an",
        "for",
        "of",
        "to",
        "in",
        "with",
        "developer",
        "engineer",
        "intern",
    }

    meaningful_words = {
        word
        for word in job_words
        if word not in ignored_words
        and len(word) > 2
    }

    if not meaningful_words:
        return 50.0

    matched_words = {
        word
        for word in meaningful_words
        if word in resume_text
    }

    score = (
        len(matched_words)
        / len(meaningful_words)
    ) * 100

    return round(
        score,
        2
    )


# =========================================================
# OVERALL RECOMMENDATION SCORE
# =========================================================

def calculate_recommendation_score(
    candidate_profile,
    resume,
    job,
) -> Dict[str, Any]:
    """
    Calculate the overall recommendation score.

    Weight distribution:

        Skills       = 50%
        Location     = 15%
        Job Type     = 10%
        Experience   = 15%
        Text Match   = 10%

    Total          = 100%
    """

    candidate_skills = extract_resume_skills(
        resume
    )

    job_skills = extract_job_skills(
        job
    )

    skill_result = calculate_skill_match(
        candidate_skills,
        job_skills
    )

    skill_score = skill_result["score"]

    location_score = calculate_location_match(
        candidate_profile,
        job
    )

    job_type_score = calculate_job_type_match(
        candidate_profile,
        job
    )

    experience_score = calculate_experience_match(
        candidate_profile,
        job
    )

    text_score = calculate_text_match(
        resume,
        job
    )

    overall_score = (
        (skill_score * 0.50)
        + (location_score * 0.15)
        + (job_type_score * 0.10)
        + (experience_score * 0.15)
        + (text_score * 0.10)
    )

    overall_score = round(
        overall_score,
        2
    )

    return {
        "recommendation_score": overall_score,

        "skill_score": round(
            skill_score,
            2
        ),

        "location_score": round(
            location_score,
            2
        ),

        "job_type_score": round(
            job_type_score,
            2
        ),

        "experience_score": round(
            experience_score,
            2
        ),

        "text_score": round(
            text_score,
            2
        ),

        "matched_skills":
            skill_result["matched_skills"],

        "missing_skills":
            skill_result["missing_skills"],
    }


# =========================================================
# GENERATE RECOMMENDATION REASON
# =========================================================

def generate_recommendation_reason(
    score_data: Dict[str, Any],
) -> str:
    """
    Generate a readable explanation
    for the recommendation score.
    """

    score = score_data[
        "recommendation_score"
    ]

    matched_skills = score_data[
        "matched_skills"
    ]

    missing_skills = score_data[
        "missing_skills"
    ]

    reasons = []

    # -----------------------------------------------------
    # Match level
    # -----------------------------------------------------

    if score >= 80:

        reasons.append(
            "Strong match based on your resume and profile."
        )

    elif score >= 60:

        reasons.append(
            "Good match based on your resume and profile."
        )

    elif score >= 40:

        reasons.append(
            "Moderate match based on your resume and profile."
        )

    else:

        reasons.append(
            "Low match based on the currently available profile data."
        )

    # -----------------------------------------------------
    # Matched skills
    # -----------------------------------------------------

    if matched_skills:

        displayed_skills = (
            matched_skills[:5]
        )

        reasons.append(
            "Matched skills: "
            + ", ".join(
                displayed_skills
            )
            + "."
        )

    # -----------------------------------------------------
    # Missing skills
    # -----------------------------------------------------

    if missing_skills:

        displayed_missing = (
            missing_skills[:5]
        )

        reasons.append(
            "Skills to improve: "
            + ", ".join(
                displayed_missing
            )
            + "."
        )

    return " ".join(
        reasons
    )


# =========================================================
# RANK JOBS
# =========================================================

def rank_jobs(
    candidate_profile,
    resume,
    jobs: List[Any],
) -> List[Dict[str, Any]]:
    """
    Calculate scores for all jobs and rank
    them from highest to lowest.
    """

    recommendations = []

    for job in jobs:

        score_data = calculate_recommendation_score(
            candidate_profile,
            resume,
            job
        )

        reason = generate_recommendation_reason(
            score_data
        )

        recommendations.append(
            {
                "job": job,

                "recommendation_score":
                    score_data[
                        "recommendation_score"
                    ],

                "skill_score":
                    score_data[
                        "skill_score"
                    ],

                "location_score":
                    score_data[
                        "location_score"
                    ],

                "job_type_score":
                    score_data[
                        "job_type_score"
                    ],

                "experience_score":
                    score_data[
                        "experience_score"
                    ],

                "text_score":
                    score_data[
                        "text_score"
                    ],

                "matched_skills":
                    score_data[
                        "matched_skills"
                    ],

                "missing_skills":
                    score_data[
                        "missing_skills"
                    ],

                "recommendation_reason":
                    reason,
            }
        )

    # -----------------------------------------------------
    # Highest score first
    # -----------------------------------------------------

    recommendations.sort(
        key=lambda item:
            item["recommendation_score"],
        reverse=True
    )

    return recommendations
