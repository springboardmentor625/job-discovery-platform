from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer

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

def calculate_swipe_preference_score(
    job,
    swipe_history,
):
    """
    Learn the user's preferences from previous swipes.

    RIGHT = strong positive preference
    DOWN  = positive preference
    LEFT  = negative preference
    """

    if not swipe_history:
        return 0

    score = 0
    total_swipes = 0

    current_title = normalize_text(job.title)
    current_city = normalize_city(job.city)
    current_type = normalize_text(job.contract_type)

    current_skills = {
        normalize_text(skill)
        for skill in job.required_skills
        if skill
    }

    for swipe in swipe_history:

        previous_job = swipe.job

        previous_title = normalize_text(previous_job.title)
        previous_city = normalize_city(previous_job.city)
        previous_type = normalize_text(previous_job.contract_type)

        previous_skills = {
            normalize_text(skill)
            for skill in previous_job.required_skills
            if skill
        }

        similarity = 0

        # Job title similarity
        if current_title and previous_title:
            current_words = set(current_title.split())
            previous_words = set(previous_title.split())

            common_words = current_words.intersection(previous_words)

            if common_words:
                similarity += 40

        # Skills similarity
        if current_skills and previous_skills:
            common_skills = current_skills.intersection(previous_skills)

            if common_skills:
                similarity += 40

        # Location similarity
        if (
            current_city
            and previous_city
            and current_city == previous_city
        ):
            similarity += 10

        # Job type similarity
        if (
            current_type
            and previous_type
            and current_type == previous_type
        ):
            similarity += 10

        # Learn from the user's action
        if swipe.swipe_direction == "right":
            score += similarity

        elif swipe.swipe_direction == "down":
            score += similarity * 0.5

        elif swipe.swipe_direction == "left":
            score -= similarity

        total_swipes += 1

    if total_swipes == 0:
        return 0

    return round(score / total_swipes, 2)
def get_recommended_jobs(
    resume_skills,
    preferred_role,
    preferred_locations,
    candidate_job_type,
    jobs,
    swipe_history=None,
    limit=10,
):
    """
    Generate SWIPEX recommendations.

    Cold Start:
        Fewer than 10 swipes -> use base recommendation score.

    ML Mode:
        10 or more swipes -> use Logistic Regression
        trained from the candidate's accumulated swipe history.
    """

    swipe_count = len(swipe_history) if swipe_history else 0

    # ---------------------------------------------------------
    # COLD START
    # ---------------------------------------------------------
    if swipe_count < 10:

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

        recommendations.sort(
            key=lambda job: job["final_score"],
            reverse=True
        )

        return recommendations[:limit]

    # ---------------------------------------------------------
    # ML MODE
    # ---------------------------------------------------------

    model, vectorizer = train_swipe_model(
        swipe_history
    )

    # If ML cannot be trained because the swipe history
    # contains only one type of label, use the existing
    # recommendation score as a temporary fallback.
    if model is None or vectorizer is None:

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

        recommendations.sort(
            key=lambda job: job["final_score"],
            reverse=True
        )

        return recommendations[:limit]

    # ---------------------------------------------------------
    # PREDICT NEW JOBS USING THE ML MODEL
    # ---------------------------------------------------------

    job_list = list(jobs)

    job_texts = []

    for job in job_list:

        skills = job.required_skills or []

        job_text = " ".join([
            normalize_text(job.title),
            " ".join(
                normalize_text(skill)
                for skill in skills
                if skill
            ),
            normalize_text(job.city),
            normalize_text(job.contract_type),
            normalize_text(job.description),
        ])

        job_texts.append(job_text)

    # Convert new jobs using the SAME vectorizer
    # that was used during model training.
    X_jobs = vectorizer.transform(job_texts)

    # Predict probability that the candidate will
    # be interested in each job.
    probabilities = model.predict_proba(X_jobs)

    positive_class_index = list(
        model.classes_
    ).index(1)

    # Create recommendation list
    recommendations = []

    for index, job in enumerate(job_list):

        like_probability = (
            probabilities[index][positive_class_index]
            * 100
        )

        # Calculate the original profile scores
        # only so the existing frontend continues
        # receiving the same response fields.
        #
        # IMPORTANT:
        # These scores are NOT used for ML ranking.
        base_result = calculate_match_score(
            resume_skills,
            preferred_role,
            preferred_locations,
            candidate_job_type,
            job,
        )

        recommendations_result = {
            "job_id": job.job_id,
            "title": job.title,
            "company_name": job.company_name,
            "city": job.city,
            "contract_type": job.contract_type,
            "description": job.description,

            # Existing profile scores
            # (display/reference only)
            "skills_score": base_result["skills_score"],
            "role_score": base_result["role_score"],
            "location_score": base_result["location_score"],
            "job_type_score": base_result["job_type_score"],

            # ML score is the actual recommendation score
            "ml_score": round(like_probability, 2),
            "final_score": round(like_probability, 2),
        }

        recommendations.append(
            recommendations_result
        )

    # Highest ML score first
    recommendations.sort(
        key=lambda job: job["final_score"],
        reverse=True
    )

    # Return top recommended jobs
    return recommendations[:limit]

def train_swipe_model(swipe_history):
    """
    Train a lightweight Logistic Regression model from
    the candidate's previous swipe history.

    RIGHT = interested
    DOWN  = saved/interested
    LEFT  = not interested
    """

    if not swipe_history:
        return None, None

    job_texts = []
    labels = []

    for swipe in swipe_history:

        job = swipe.job

        skills = job.required_skills or []

        # Combine important job information into one text
        job_text = " ".join([
            normalize_text(job.title),
            " ".join(
                normalize_text(skill)
                for skill in skills
                if skill
            ),
            normalize_text(job.city),
            normalize_text(job.contract_type),
            normalize_text(job.description),
        ])

        job_texts.append(job_text)

        # Training labels
        if swipe.swipe_direction in ["right", "down"]:
            labels.append(1)

        elif swipe.swipe_direction == "left":
            labels.append(0)

    # Need both positive and negative examples
    if len(set(labels)) < 2:
        return None, None

    # Convert job text into numerical ML features
    vectorizer = TfidfVectorizer(
        stop_words="english",
        max_features=1000
    )

    X = vectorizer.fit_transform(job_texts)

    # Train Logistic Regression
    model = LogisticRegression(
        max_iter=1000
    )

    model.fit(X, labels)

    return model, vectorizer