"""
matcher.py

Compares resume skills with job skills and
calculates probability score.
"""


def compare_skills(candidate_skills, required_skills):

    candidate = {
        skill.strip().lower()
        for skill in candidate_skills
    }

    required = {
        skill.strip().lower()
        for skill in required_skills
    }

    matched = sorted(candidate & required)

    missing = sorted(required - candidate)

    return matched, missing


def calculate_probability(candidate_skills, required_skills):

    if not required_skills:
        return 0

    matched, _ = compare_skills(
        candidate_skills,
        required_skills
    )

    probability = (
        len(matched) /
        len(required_skills)
    ) * 100

    return round(probability, 2)


def generate_feedback(probability):

    if probability >= 90:
        return "Excellent match. Highly recommended."

    elif probability >= 75:
        return "Good match. Minor skill improvements recommended."

    elif probability >= 50:
        return "Average match. Improve missing skills."

    else:
        return "Low match. Consider learning required technologies."