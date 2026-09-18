import re

from .embeddings import (
    EMBEDDINGS_AVAILABLE,
    get_embedding,
    get_cached_job_embedding,
    cosine_similarity,
    word_overlap_similarity
)
from .skill_utils import split_skills
from .candidate_data import experience_match_score, experience_range_match_score

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

# An exhausted Groq account will reject every subsequent optional
# suggestion request. Remember that state for this process so ATS scoring
# does not keep making doomed API calls.
_GROQ_SUGGESTIONS_DISABLED = False


def guess_job_category(title, description=""):
    """Classify a job into a stable broad category for recommendation features."""
    text = f"{title or ''} {description or ''}".lower()
    categories = {
        # Checked in this order deliberately: "software"'s keywords
        # include generic single words ("engineer", "developer") that
        # would false-match "Data Engineer", "ML Engineer", and "AI
        # Engineer" before ever reaching "data"'s more specific
        # phrases if "software" were checked first. Specific
        # categories are listed before the generic fallback.
        "data": ("data scientist", "data analyst", "data engineer", "machine learning", "artificial intelligence", "ml engineer", "ai engineer", "analytics", "bi developer", "data science"),
        "design": ("designer", "ui", "ux", "product design", "graphic design"),
        "marketing": ("marketing", "seo", "content", "social media", "brand"),
        "sales": ("sales", "business development", "account executive", "relationship manager"),
        "finance": ("finance", "accountant", "accounting", "audit", "banking", "tax"),
        "hr": ("human resources", "hr", "recruiter", "talent acquisition"),
        "operations": ("operations", "supply chain", "logistics", "procurement"),
        # Checked LAST — deliberately: these are the most generic,
        # highest-collision terms and would false-match every
        # category above if checked first.
        "software": ("software", "developer", "engineer", "programmer", "full stack", "backend", "frontend", "web", "mobile", "devops", "cloud"),
    }
    for category, keywords in categories.items():
        if any(
            re.search(rf"(?<!\w){re.escape(keyword)}(?!\w)", text)
            for keyword in keywords
        ):
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

def experience_fit_score(candidate_years, job_experience_required):
    return round(
        experience_match_score(
            candidate_years,
            job_experience_required,
        ),
        2,
    )


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

    # Fallback: shared word-overlap heuristic (see embeddings.py) — this
    # used to be a second, independently-maintained copy of the same
    # logic with its own stopword list, which could silently disagree
    # with the recommendation engine's own fallback score for the same
    # text. Now both call the one shared implementation.
    return word_overlap_similarity(candidate_text, job_description)


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
        experience_years: float | None,
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

    candidate_min = resume_data.get("experience_years")
    candidate_max = candidate_min
    if candidate_min is None:
        candidate_min = resume_data.get("experience_min_years")
        candidate_max = resume_data.get("experience_max_years")
    experience_score = experience_range_match_score(
        candidate_min,
        candidate_max,
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
# OPTIONAL: GROQ IMPROVEMENT SUGGESTION
#
# Skips gracefully (returns None) if
# GROQ_API_KEY isn't set — this is an
# enhancement, not a required part of the score.
# ==========================================

def generate_improvement_suggestion(missing_skills, job_title):

    import os

    global _GROQ_SUGGESTIONS_DISABLED

    from dotenv import load_dotenv

    load_dotenv()
    if _GROQ_SUGGESTIONS_DISABLED:
        return None
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        print(
            "[ats_service] GROQ_API_KEY not set — skipping "
            "AI-generated improvement suggestion, missing_skills "
            "list is still returned as-is."
        )
        return None

    if not missing_skills:
        return None

    try:
        from groq import Groq

        client = Groq(api_key=api_key)

        prompt = (
            f"A candidate is missing these skills for a '{job_title}' "
            f"role: {', '.join(missing_skills[:5])}. Write exactly one "
            "complete, specific, encouraging sentence of no more than "
            "35 words explaining how to improve these skills. Do not "
            "include a heading or bullet point."
        )

        response = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "openai/gpt-oss-20b"),
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
        )

        return response.choices[0].message.content.strip()

    except Exception as error:  # noqa: BLE001

        error_text = str(error)
        if (
            "rate_limit_exceeded" in error_text
            or "insufficient_quota" in error_text
            or "credit_balance_exhausted" in error_text
        ):
            _GROQ_SUGGESTIONS_DISABLED = True
            print(
                "[ats_service] Groq rate limit reached — disabling optional "
                "suggestions for this process."
            )
            return None

        print(
            f"[ats_service] Groq suggestion generation failed: {error} "
            "— continuing without it."
        )
        return None
