def calculate_skill_match(candidate_skills, job_skills):
    """
    Calculate skill match percentage.

    Example:
    Candidate: Python, SQL, Flask, Docker
    Job:       Python, SQL, Flask

    Matched = 3
    Job skills = 3

    Skill Match = 100%
    """

    if not job_skills:
        return 0.0

    # Convert everything to lowercase
    candidate = {
        skill.strip().lower()
        for skill in candidate_skills
    }

    required = {
        skill.strip().lower()
        for skill in job_skills
    }

    if not required:
        return 0.0

    matched_skills = candidate.intersection(required)

    return (len(matched_skills) / len(required)) * 100


def calculate_location_match(
    preferred_location,
    job_location
):
    """
    Location match:
    100 = preferred location matches job location
    0   = doesn't match
    """

    if not preferred_location or not job_location:
        return 0.0

    preferred = preferred_location.strip().lower()
    job = job_location.strip().lower()

    if preferred in job or job in preferred:
        return 100.0

    return 0.0


def calculate_job_type_match(
    preferred_job_type,
    job_type
):
    """
    Job type match:
    100 = matches
    0   = doesn't match
    """

    if not preferred_job_type or not job_type:
        return 0.0

    preferred = preferred_job_type.strip().lower()
    actual = job_type.strip().lower()

    if preferred == actual:
        return 100.0

    return 0.0


def calculate_recommendation_score(
    candidate_skills,
    preferred_location,
    preferred_job_type,
    job_skills,
    job_location,
    job_type
):
    """
    Final recommendation score.

    Skills       = 70%
    Location     = 15%
    Job Type     = 15%
    """

    skill_match = calculate_skill_match(
        candidate_skills,
        job_skills
    )

    location_match = calculate_location_match(
        preferred_location,
        job_location
    )

    job_type_match = calculate_job_type_match(
        preferred_job_type,
        job_type
    )

    final_score = (
        skill_match * 0.70
        + location_match * 0.15
        + job_type_match * 0.15
    )

    return {
        "skill_match": round(skill_match, 2),
        "location_match": round(location_match, 2),
        "job_type_match": round(job_type_match, 2),
        "recommendation_score": round(final_score, 2)
    }