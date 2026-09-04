"""Shared skill normalization helpers used by matching and ATS scoring."""

from .resume_parser import normalize_skill


def split_skills(raw):
    """Convert a comma-separated skill string into normalized skill names."""
    if not raw:
        return set()

    return {
        normalize_skill(skill)
        for skill in str(raw).split(",")
        if skill.strip()
    }
