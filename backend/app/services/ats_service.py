import re

from .embeddings import (
    EMBEDDINGS_AVAILABLE,
    get_embedding,
    get_cached_job_embedding,
    cosine_similarity
)
from .skill_utils import split_skills

# ==========================================
# ATS SCORING SERVICE
#
# calculate_ats_score(resume_data, job_data) ->
# {
#   ats_score, breakdown: {required, preferred,
#   experience, semantic, education},
#   missing_skills: [...]
# }
#
# Weights: required 35% / preferred 15% /
# experience 20% / semantic 20% / education 10%
# ==========================================

WEIGHTS = {
    "skills": 0.50,
    "experience": 0.20,
    "semantic": 0.20,
    "education": 0.10,
}

# Required skills remain more important than preferred skills
# inside the combined 50% Skills Match component.
REQUIRED_SKILL_SHARE = 0.70
PREFERRED_SKILL_SHARE = 0.30


# ==========================================
# CANDIDATE EXPERIENCE LEVEL -> APPROX YEARS
# Maps the CandidateProfile.experience enum
# (see schemas.EXPERIENCE_LEVELS) onto a rough
# numeric years figure so it can be compared
# against a job's free-text experience_required
# (e.g. "1-3 years"), which is parsed with the
# same regex helper job_routes.py already uses.
# ==========================================

EXPERIENCE_LEVEL_YEARS = {
    "fresher / entry-level": 0,
    "intern": 0,
    "trainee": 0,
    "junior / associate": 1,
    "mid-level": 3,
    "senior-level": 6,
    "lead": 8,
    "manager": 10,
    "experienced professional": 5,
}


def _extract_years_from_text(text):
    """
    Reuses the same pattern as job_routes.
    extract_experience_years — duplicated here
    (rather than imported) to avoid a routes ->
    services import, which would invert the
    normal dependency direction in this codebase.
    """

    if not text:
        return []

    text = str(text).lower()

    matches = re.findall(
        r"(\d+(?:\.\d+)?)\s*(?:\+?\s*)?(?:years?|yrs?)",
        text
    )

    years = [float(match) for match in matches]

    if not years:
        number = re.search(r"(\d+(?:\.\d+)?)", text)
        if number:
            years.append(float(number.group(1)))

    return years


def guess_job_category(title, description=""):
    """Classify a job into a stable broad category for recommendation features."""
    text = f"{title or ''} {description or ''}".lower()
    categories = {
        "software": ("software", "developer", "engineer", "programmer", "full stack", "backend", "frontend", "web", "mobile", "devops", "cloud"),
        "data": ("data scientist", "data analyst", "data engineer", "machine learning", "artificial intelligence", "analytics", "bi developer"),
        "design": ("designer", "ui", "ux", "product design", "graphic design"),
        "marketing": ("marketing", "seo", "content", "social media", "brand"),
        "sales": ("sales", "business development", "account executive", "relationship manager"),
        "finance": ("finance", "accountant", "accounting", "audit", "banking", "tax"),
        "hr": ("human resources", "hr", "recruiter", "talent acquisition"),
        "operations": ("operations", "supply chain", "logistics", "procurement"),
    }
    for category, keywords in categories.items():
        if any(keyword in text for keyword in keywords):
            return category
    return "other"


# ==========================================
# REQUIRED SKILLS MATCH (35%)
# ==========================================

def required_skills_score(candidate_skills, job_required_skills):

    if not job_required_skills:
        return 100.0, []

    matched = candidate_skills.intersection(job_required_skills)
    missing = sorted(job_required_skills - candidate_skills)

    score = round((len(matched) / len(job_required_skills)) * 100, 2)

    return score, missing


# ==========================================
# PREFERRED SKILLS MATCH (15%)
# Job.preferred_skills is a newer, optional
# column — most existing job rows (including
# imported test data) won't have it set. A job
# with no preferred skills listed isn't
# penalized: it returns a neutral 100.
# ==========================================

def preferred_skills_score(candidate_skills, job_preferred_skills):

    if not job_preferred_skills:
        return 100.0, []

    matched = candidate_skills.intersection(job_preferred_skills)
    missing = sorted(job_preferred_skills - candidate_skills)

    score = round((len(matched) / len(job_preferred_skills)) * 100, 2)

    return score, missing


# ==========================================
# EXPERIENCE FIT (20%)
# ==========================================

def experience_fit_score(candidate_experience_level, job_experience_required):

    job_years_list = _extract_years_from_text(job_experience_required)

    if not job_years_list:
        # Job doesn't specify a parseable experience
        # requirement — don't penalize for it.
        return 100.0

    job_years = min(job_years_list)

    candidate_years = EXPERIENCE_LEVEL_YEARS.get(
        (candidate_experience_level or "").strip().lower(),
        0
    )

    if candidate_years >= job_years:
        return 100.0

    # Partial credit the closer the candidate is
    # to the requirement, floor at 0.
    gap = job_years - candidate_years
    score = max(0.0, 100.0 - (gap * 20))

    return round(score, 2)


# ==========================================
# SEMANTIC SIMILARITY (20%)
# Real embedding cosine similarity when
# sentence-transformers is available, falling
# back to a word-overlap heuristic otherwise —
# same graceful-degradation pattern used in
# recommendation_routes.py.
# ==========================================

def semantic_similarity_score(job_id, job_description, candidate_text):

    if EMBEDDINGS_AVAILABLE:

        job_embedding = get_cached_job_embedding(job_id, job_description)
        candidate_embedding = get_embedding(candidate_text)

        if job_embedding and candidate_embedding:
            return cosine_similarity(job_embedding, candidate_embedding)

    # Fallback: word overlap
    stopwords = {
        "the", "and", "for", "with", "you", "are", "our", "will",
        "have", "has", "this", "that", "your", "from", "job", "role",
    }

    def words(text):
        if not text:
            return set()
        return {
            w for w in re.findall(r"[a-zA-Z]{3,}", text.lower())
            if w not in stopwords
        }

    job_words = words(job_description)
    candidate_words = words(candidate_text)

    if not job_words or not candidate_words:
        return 0.0

    overlap = job_words.intersection(candidate_words)

    return round(min((len(overlap) / len(job_words)) * 100, 100), 2)


# ==========================================
# EDUCATION MATCH (10%)
#
# HONESTY NOTE: Job postings in this schema
# don't have a structured "required education"
# field — only a free-text description. This
# does a best-effort keyword match between the
# candidate's education string and degree-related
# keywords in the job description. Absence of an
# explicit requirement in the description is NOT
# treated as a failure (defaults to a neutral
# score) since most job posts here don't state one.
# ==========================================

DEGREE_KEYWORDS = [
    "b.e", "b.tech", "btech", "m.e", "m.tech", "mtech", "b.sc",
    "bca", "mca", "mba", "phd", "bachelor", "master", "degree",
    "diploma", "engineering", "graduate"
]


def education_match_score(candidate_education, job_description):

    if not candidate_education:
        return 60.0  # neutral-low: no education info to compare

    description_lower = (job_description or "").lower()

    mentioned_keywords = [
        keyword for keyword in DEGREE_KEYWORDS
        if keyword in description_lower
    ]

    if not mentioned_keywords:
        # Job description doesn't state a degree
        # requirement — don't penalize.
        return 100.0

    candidate_lower = candidate_education.lower()

    if any(keyword in candidate_lower for keyword in mentioned_keywords):
        return 100.0

    return 50.0


# ==========================================
# MAIN ENTRY POINT
# ==========================================

def calculate_ats_score(resume_data, job_data):
    """
    resume_data: {
        skills: str (comma-separated),
        experience_level: str,
        education: str,
        resume_text: str,
    }
    job_data: {
        job_id: int,
        skills: str (comma-separated, required),
        preferred_skills: str | None,
        experience_required: str | None,
        description: str,
    }
    """

    candidate_skills = split_skills(resume_data.get("skills"))
    job_required_skills = split_skills(job_data.get("skills"))
    job_preferred_skills = split_skills(job_data.get("preferred_skills"))

    required_score, missing_required = required_skills_score(
        candidate_skills, job_required_skills
    )

    preferred_score, missing_preferred = preferred_skills_score(
        candidate_skills, job_preferred_skills
    )

    experience_score = experience_fit_score(
        resume_data.get("experience_level"),
        job_data.get("experience_required")
    )

    semantic_score = semantic_similarity_score(
        job_data.get("job_id"),
        job_data.get("description"),
        resume_data.get("resume_text")
    )

    education_score = education_match_score(
        resume_data.get("education"),
        job_data.get("description")
    )

    # Merge required + preferred skills into one Skills Match score.
    # Required skills carry more influence, while preferred skills
    # provide additional credit without being treated as mandatory.
    skills_score = round(
        required_score * REQUIRED_SKILL_SHARE
        + preferred_score * PREFERRED_SKILL_SHARE,
        2
    )

    ats_score = round(
        skills_score * WEIGHTS["skills"]
        + experience_score * WEIGHTS["experience"]
        + semantic_score * WEIGHTS["semantic"]
        + education_score * WEIGHTS["education"],
        2
    )

    missing_skills = missing_required + [
        skill for skill in missing_preferred if skill not in missing_required
    ]

    return {
        "ats_score": ats_score,
        "breakdown": {
            "skills": skills_score,
            "experience": experience_score,
            "semantic": semantic_score,
            "education": education_score,
            # Kept as diagnostic values so existing consumers can
            # still inspect the two underlying skill matches.
            "required": required_score,
            "preferred": preferred_score,
        },
        "missing_skills": missing_skills,
    }


# ==========================================
# OPTIONAL: OPENAI IMPROVEMENT SUGGESTION
#
# Skips gracefully (returns None) if
# OPENAI_API_KEY isn't set — this is an
# enhancement, not a required part of the score.
# ==========================================

def generate_improvement_suggestion(missing_skills, job_title):

    import os

    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        print(
            "[ats_service] OPENAI_API_KEY not set — skipping "
            "AI-generated improvement suggestion, missing_skills "
            "list is still returned as-is."
        )
        return None

    if not missing_skills:
        return None

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)

        prompt = (
            f"A candidate is missing these skills for a '{job_title}' "
            f"role: {', '.join(missing_skills[:5])}. In 1-2 sentences, "
            "give a specific, encouraging suggestion for how they could "
            "close this gap or reframe their existing experience."
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100,
        )

        return response.choices[0].message.content.strip()

    except Exception as error:  # noqa: BLE001

        print(
            f"[ats_service] OpenAI suggestion generation failed: {error} "
            "— continuing without it."
        )
        return None
