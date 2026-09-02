from .matcher import (
    compare_skills,
    calculate_probability,
    generate_feedback,
)
# =====================================
# ATS CALCULATOR
# =====================================

def calculate_ats(parsed_data):

    score = 0

    feedback = []

    # =====================================
    # SKILLS - 30 POINTS
    # =====================================

    skills = parsed_data.get(
        "skills",
        []
    )

    skill_count = len(skills)

    if skill_count >= 8:

        score += 30

        feedback.append(
            "Excellent technical skill coverage."
        )

    elif skill_count >= 5:

        score += 25

        feedback.append(
            "Good technical skill coverage."
        )

    elif skill_count >= 3:

        score += 20

        feedback.append(
            "Average technical skill coverage."
        )

    elif skill_count > 0:

        score += 10

        feedback.append(
            "Add more relevant technical skills."
        )

    else:

        feedback.append(
            "No technical skills detected."
        )


    # =====================================
    # EXPERIENCE - 20 POINTS
    # =====================================

    if parsed_data.get("experience"):

        score += 20

        feedback.append(
            "Experience detected."
        )

    else:

        feedback.append(
            "Experience information not found."
        )


    # =====================================
    # EDUCATION - 20 POINTS
    # =====================================

    if parsed_data.get("education"):

        score += 20

        feedback.append(
            "Education information detected."
        )

    else:

        feedback.append(
            "Education information not found."
        )


    # =====================================
    # PROJECTS - 15 POINTS
    # =====================================

    if parsed_data.get("projects"):

        score += 15

        feedback.append(
            "Projects detected."
        )

    else:

        feedback.append(
            "Add projects to improve your resume."
        )


    # =====================================
    # CERTIFICATIONS - 15 POINTS
    # =====================================

    if parsed_data.get("certifications"):

        score += 15

        feedback.append(
            "Certifications detected."
        )

    else:

        feedback.append(
            "Consider adding relevant certifications."
        )


    # =====================================
    # RETURN
    # =====================================

    return {

        "score": score,

        "feedback": feedback,

        "skill_count": skill_count,
    }

# =====================================
# PROBABILITY CALCULATOR
# =====================================

def calculate_probability_report(parsed_resume, required_skills):

    candidate_skills = parsed_resume.get(
        "skills",
        []
    )

    matched, missing = compare_skills(
        candidate_skills,
        required_skills
    )

    probability = calculate_probability(
        candidate_skills,
        required_skills
    )

    feedback = generate_feedback(
        probability
    )

    return {

        "probability": probability,

        "matched_skills": matched,

        "missing_skills": missing,

        "feedback": feedback,

    }