def calculate_match(
    candidate_skills,
    required_skills
):

    if not required_skills:

        return 0

    candidate = set(
        skill.lower()
        for skill in candidate_skills
    )

    required = set(
        skill.lower()
        for skill in required_skills
    )

    matched = candidate.intersection(
        required
    )

    return round(
        len(matched) / len(required) * 100,
        2
    )