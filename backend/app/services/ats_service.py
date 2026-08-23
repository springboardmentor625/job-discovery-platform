def analyze_resume(
    resume_skills,
    job_skills
):

    resume_set = set(
        skill.lower()
        for skill in resume_skills
    )

    job_set = set(
        skill.lower()
        for skill in job_skills
    )

    matched = resume_set.intersection(
        job_set
    )

    missing = job_set - resume_set

    if len(job_set) == 0:

        score = 0

    else:

        score = (
            len(matched)
            / len(job_set)
        ) * 100

    suggestions = ""

    if missing:

        suggestions = (
            "Consider adding or improving "
            "these skills: "
            + ", ".join(missing)
        )

    else:

        suggestions = (
            "Resume matches the major "
            "required skills."
        )

    return {
        "ats_score": round(score, 2),
        "match_percentage": round(score, 2),
        "missing_skills": list(missing),
        "missing_keywords": list(missing),
        "suggestions": suggestions
    }