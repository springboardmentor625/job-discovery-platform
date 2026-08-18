def calculate_ats(parsed_data):
    score = 0
    feedback = []

    # Skills
    skills = parsed_data.get("skills", [])
    if len(skills) >= 5:
        score += 30
        feedback.append("Good technical skills.")
    elif len(skills) >= 3:
        score += 20
        feedback.append("Average skill coverage.")
    elif len(skills) > 0:
        score += 10
        feedback.append("Add more technical skills.")
    else:
        feedback.append("No technical skills detected.")

    # Experience
    if parsed_data.get("experience"):
        score += 20
        feedback.append("Experience detected.")
    else:
        feedback.append("Experience not found.")

    # Education
    if parsed_data.get("education"):
        score += 20
        feedback.append("Education found.")
    else:
        feedback.append("Education section missing.")

    # Projects
    if parsed_data.get("projects"):
        score += 15
        feedback.append("Projects included.")
    else:
        feedback.append("Add projects to improve ATS score.")

    # Certifications
    if parsed_data.get("certifications"):
        score += 15
        feedback.append("Certifications detected.")
    else:
        feedback.append("Certifications not found.")

    return {
        "score": score,
        "feedback": feedback
    }