def normalize_text(value):
    """
    Convert text into a normalized format
    for case-insensitive comparison.
    """
    if not value:
        return ""

    return " ".join(str(value).lower().strip().split())


def calculate_skills_score(resume_skills, job_skills):
    """
    Calculate the skills match percentage.

    Formula:
    matched skills / total job required skills * 100
    """

    if not job_skills:
        return 0

    candidate_skills = {
        normalize_text(skill)
        for skill in resume_skills
        if skill
    }

    required_skills = {
        normalize_text(skill)
        for skill in job_skills
        if skill
    }

    if not required_skills:
        return 0

    matched_skills = candidate_skills.intersection(required_skills)

    return (len(matched_skills) / len(required_skills)) * 100


def calculate_role_score(preferred_role, job_title):
    """
    Calculate preferred job role match.

    Supports multiple preferred roles separated by commas.

    Returns:
        100 -> strong role match
        50  -> partial role match
        0   -> no meaningful role match
    """

    if not preferred_role or not job_title:
        return 0

    # Candidate can enter multiple preferred roles
    preferred_roles = [
        normalize_text(role)
        for role in str(preferred_role).split(",")
        if role.strip()
    ]

    if not preferred_roles:
        return 0

    def normalize_role(role):
        role = normalize_text(role)

        # Remove punctuation
        role = role.replace("-", " ")

        # Normalize common terminology
        replacements = {
            "full stack": "fullstack",
            "fullstack": "fullstack",

            "software developer": "software engineer",

            "data science": "data scientist",
            "data scientist": "data scientist",

            "data analytics": "data analyst",
            "data analyst": "data analyst",
        }

        for old, new in replacements.items():
            role = role.replace(old, new)

        return set(role.split())

    job_words = normalize_role(job_title)

    best_score = 0

    for role in preferred_roles:

        role_words = normalize_role(role)

        if not role_words:
            continue

        # Ignore generic words when calculating role similarity
        generic_words = {
            "developer",
            "engineer",
            "manager",
            "senior",
            "junior",
            "associate",
            "lead",
            "specialist",
        }

        meaningful_role_words = role_words - generic_words

        if not meaningful_role_words:
            meaningful_role_words = role_words

        matched_words = meaningful_role_words.intersection(job_words)

        if not matched_words:
            continue

        score = (
            len(matched_words)
            / len(meaningful_role_words)
        ) * 100

        best_score = max(best_score, score)

    return round(best_score, 2)


def normalize_city(city):
    """
    Normalize common city-name variations.
    """

    city = normalize_text(city)

    city_aliases = {
        "bangalore": "bengaluru",
        "bengaluru": "bengaluru",
        "bombay": "mumbai",
        "mumbai": "mumbai",
        "calcutta": "kolkata",
        "kolkata": "kolkata",
        "madras": "chennai",
        "chennai": "chennai",
    }

    return city_aliases.get(city, city)


def calculate_location_score(preferred_locations, job_city):
    """
    Calculate preferred location match.

    100% -> job city matches one of candidate's preferred cities
    0%   -> no match
    """

    if not preferred_locations or not job_city:
        return 0

    normalized_preferences = {
        normalize_city(location)
        for location in preferred_locations
        if location
    }

    normalized_job_city = normalize_city(job_city)

    if normalized_job_city in normalized_preferences:
        return 100

    return 0


def calculate_job_type_score(candidate_job_type, job_contract_type):
    """
    Calculate job type match.

    100% -> candidate and job type match
    0%   -> no match
    """

    candidate_job_type = normalize_text(candidate_job_type)
    job_contract_type = normalize_text(job_contract_type)

    if not candidate_job_type or not job_contract_type:
        return 0

    job_type_aliases = {
        "full time": "full-time",
        "full-time": "full-time",
        "fulltime": "full-time",
        "part time": "part-time",
        "part-time": "part-time",
        "parttime": "part-time",
        "intern": "internship",
        "internship": "internship",
        "contract": "contract",
    }

    candidate_type = job_type_aliases.get(
        candidate_job_type,
        candidate_job_type
    )

    job_type = job_type_aliases.get(
        job_contract_type,
        job_contract_type
    )

    if candidate_type == job_type:
        return 100

    return 0


def calculate_match_score(
    resume_skills,
    preferred_role,
    preferred_locations,
    candidate_job_type,
    job,
):
    """
    Calculate the final SWIPEX recommendation score.

    Weights:

    Skills       = 50%
    Role         = 20%
    Location     = 15%
    Job Type     = 15%
    """

    skills_score = calculate_skills_score(
        resume_skills,
        job.required_skills
    )

    role_score = calculate_role_score(
        preferred_role,
        job.title
    )

    location_score = calculate_location_score(
        preferred_locations,
        job.city
    )

    job_type_score = calculate_job_type_score(
        candidate_job_type,
        job.contract_type
    )

    final_score = (
        (skills_score * 0.50)
        + (role_score * 0.20)
        + (location_score * 0.15)
        + (job_type_score * 0.15)
    )

    # Balanced relevance adjustment
    # Prevent jobs with no role AND no job-type match
    # from appearing too highly in recommendations.
    if role_score == 0 and job_type_score == 0:
        final_score *= 0.50

    return {
        "job_id": job.job_id,
        "title": job.title,
        "company_name": job.company_name,
        "city": job.city,
        "contract_type": job.contract_type,
        "skills_score": round(skills_score, 2),
        "role_score": round(role_score, 2),
        "location_score": round(location_score, 2),
        "job_type_score": round(job_type_score, 2),
        "final_score": round(final_score, 2),
    }

def get_recommended_jobs(
    resume_skills,
    preferred_role,
    preferred_locations,
    candidate_job_type,
    jobs,
    limit=10,
):
    """
    Calculate recommendation scores for multiple jobs
    and return them ranked from highest to lowest score.
    """

    recommendations = []

    for job in jobs:
        result = calculate_match_score(
            resume_skills,
            preferred_role,
            preferred_locations,
            candidate_job_type,
            job,
        )

        recommendations.append(result)

    # Highest score first
    recommendations.sort(
        key=lambda job: job["final_score"],
        reverse=True
    )

    # Return only the requested number of jobs
    return recommendations[:limit]