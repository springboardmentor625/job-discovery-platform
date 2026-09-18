import re
from dataclasses import dataclass

from sqlalchemy.orm import Session

from ..models import CandidateProfile, Resume
from .skill_utils import merge_skills, normalize_skills


_EXPERIENCE_PATTERN = re.compile(
    r"(?P<first>\d+(?:\.\d+)?)\s*(?:years?|yrs?)"
    r"(?:\s*(?:-|–|—|to)\s*(?P<second>\d+(?:\.\d+)?)\s*(?:years?|yrs?))?"
    r"|(?P<range_first>\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(?P<range_second>\d+(?:\.\d+)?)\s*(?:years?|yrs?)"
    r"|(?P<plus>\d+(?:\.\d+)?)\s*\+\s*(?:years?|yrs?)",
    re.IGNORECASE,
)

JOB_EXPERIENCE_LEVEL_YEARS = {
    "entry level": (0.0, 1.0),
    "entry-level": (0.0, 1.0),
    "junior": (1.0, 2.0),
    "mid-level": (2.0, 5.0),
    "mid level": (2.0, 5.0),
    "senior": (5.0, None),
    "senior-level": (5.0, None),
}


@dataclass(frozen=True)
class CandidateData:
    skills: set[str]
    experience_years: float | None
    experience_min_years: float | None
    experience_max_years: float | None
    education: str
    resume_text: str
    profile_text: str
    combined_text: str
    preferred_roles: str


def _text(value):
    return str(value or "").strip()


def parse_experience_range(value):
    """Parse explicit experience without collapsing ranges to their maximum."""
    text = _text(value).lower()
    if not text:
        return None, None

    match = _EXPERIENCE_PATTERN.search(text)
    if match:
        first = match.group("first") or match.group("range_first") or match.group("plus")
        second = match.group("second") or match.group("range_second")
        minimum = float(first)
        maximum = float(second) if second else (None if match.group("plus") else minimum)
        return minimum, maximum

    return JOB_EXPERIENCE_LEVEL_YEARS.get(text, (None, None))


def experience_years(value):
    """Return the minimum of an explicit numeric experience expression."""
    minimum, _ = parse_experience_range(value)
    return minimum


def candidate_experience_range(value):
    return parse_experience_range(value)


def extract_resume_experience_range(value):
    """Extract experience only from professional-context lines."""
    excluded = re.compile(r"education|academic|project|certif|graduat|course|internship program", re.IGNORECASE)
    for line in _text(value).splitlines() or [_text(value)]:
        if excluded.search(line):
            continue
        if re.search(r"\b(?:experience|worked|work|developer|engineer|manager|analyst|professional)\b", line, re.IGNORECASE):
            minimum, maximum = parse_experience_range(line)
            if minimum is not None:
                return minimum, maximum
    return None, None


def job_experience_range(value):
    """Return a parsed minimum/maximum requirement for matching."""
    text = _text(value).lower()
    if not text:
        return None, None

    values = [float(item) for item in re.findall(r"\d+(?:\.\d+)?", text)]
    if not values:
        level = experience_years(text)
        return (level, level) if level is not None else (None, None)
    if "+" in text:
        return values[0], None
    if len(values) >= 2 and re.search(r"-|\bto\b", text):
        return min(values[:2]), max(values[:2])
    return values[0], values[0]


def experience_match_score(candidate_years, requirement):
    minimum, maximum = job_experience_range(requirement)
    if candidate_years is None or minimum is None:
        return 60.0
    if candidate_years < minimum:
        return max(0.0, 100.0 - (minimum - candidate_years) * 20.0)
    if maximum is not None and candidate_years > maximum:
        return max(60.0, 100.0 - (candidate_years - maximum) * 10.0)
    return 100.0


def experience_range_match_score(candidate_min, candidate_max, requirement):
    minimum, maximum = job_experience_range(requirement)
    if candidate_min is None or minimum is None:
        return 60.0
    candidate_max = candidate_min if candidate_max is None else candidate_max
    if candidate_max < minimum:
        return max(0.0, 100.0 - (minimum - candidate_max) * 20.0)
    if maximum is not None and candidate_min > maximum:
        return max(60.0, 100.0 - (candidate_min - maximum) * 10.0)
    return 100.0


def build_candidate_data(db: Session, user_id: int) -> CandidateData:
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    resume = (
        db.query(Resume)
        .filter(Resume.user_id == user_id, Resume.is_primary == True)  # noqa: E712
        .order_by(Resume.uploaded_at.desc())
        .first()
    )

    profile_skills = normalize_skills(profile.skills if profile else "")
    resume_skills = normalize_skills(resume.extracted_skills if resume else "")
    skills = merge_skills(profile_skills, resume_skills)
    profile_text = " ".join(
        _text(getattr(profile, field, ""))
        for field in ("headline", "bio", "skills", "education", "preferred_role")
    ).strip()
    resume_text = _text(resume.extracted_text if resume else "")
    profile_experience = profile.experience_years if profile else None
    resume_experience = _text(resume.extracted_experience if resume else "")
    if profile_experience is not None:
        experience_min = float(profile_experience)
        experience_max = float(profile_experience)
    else:
        experience_min, experience_max = extract_resume_experience_range(resume_experience)
    return CandidateData(
        skills=skills,
        experience_years=experience_min,
        experience_min_years=experience_min,
        experience_max_years=experience_max,
        education=_text(
            profile.education if profile and profile.education
            else resume.extracted_education if resume else ""
        ),
        resume_text=resume_text,
        profile_text=profile_text,
        combined_text=" ".join(part for part in (profile_text, resume_text) if part),
        preferred_roles=_text(profile.preferred_role if profile else ""),
    )
