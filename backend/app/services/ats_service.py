# =========================================================
# SwipeX - ATS Analysis Service
# =========================================================

import json
import re
from typing import List, Any


# =========================================================
# CONVERT SKILLS INTO A CLEAN LIST
# =========================================================

def prepare_skills(skills: Any) -> List[str]:
    """
    Convert different skill formats into a clean list.

    Supported formats:
    - ["Python", "React", "Git"]
    - "Python, React, Git"
    - '["Python", "React", "Git"]'
    - ["Python, React, Git"]
    """

    if skills is None:
        return []

    # -----------------------------------------------------
    # CASE 1 - ALREADY A LIST
    # -----------------------------------------------------

    if isinstance(skills, list):

        cleaned_skills = []

        for skill in skills:

            if skill is None:
                continue

            # If an individual list item contains commas
            if isinstance(skill, str):

                parts = re.split(
                    r",|;|\n|\|",
                    skill
                )

                for part in parts:

                    part = part.strip()

                    if part:
                        cleaned_skills.append(part)

            else:

                skill_text = str(skill).strip()

                if skill_text:
                    cleaned_skills.append(skill_text)

        return cleaned_skills


    # -----------------------------------------------------
    # CASE 2 - STRING
    # -----------------------------------------------------

    if isinstance(skills, str):

        skills = skills.strip()

        if not skills:
            return []


        # -------------------------------------------------
        # TRY JSON STRING
        # -------------------------------------------------

        try:

            parsed = json.loads(skills)

            if isinstance(parsed, list):

                return prepare_skills(parsed)

        except (json.JSONDecodeError, TypeError):

            pass


        # -------------------------------------------------
        # SPLIT NORMAL STRING
        # -------------------------------------------------

        parts = re.split(
            r",|;|\n|\|",
            skills
        )

        return [
            part.strip()
            for part in parts
            if part.strip()
        ]


    # -----------------------------------------------------
    # FALLBACK
    # -----------------------------------------------------

    return [str(skills).strip()]


# =========================================================
# NORMALIZE SKILL
# =========================================================

def normalize_skill(skill: str) -> str:
    """
    Convert a skill into a standard format
    for comparison.
    """

    skill = str(skill).strip().lower()

    # Replace common punctuation with spaces
    skill = re.sub(
        r"[^a-z0-9+#.\- ]+",
        " ",
        skill
    )

    # Normalize multiple spaces
    skill = re.sub(
        r"\s+",
        " ",
        skill
    )

    return skill.strip()


# =========================================================
# CALCULATE ATS SCORE
# =========================================================

def calculate_ats_score(
    resume_skills: List[str],
    required_skills: List[str]
):
    """
    Compare resume skills with job-required skills.

    Returns:
        ats_score
        match_percentage
        matched_skills
        missing_skills
    """

    # -----------------------------------------------------
    # PREPARE BOTH SKILL LISTS
    # -----------------------------------------------------

    resume_skills = prepare_skills(
        resume_skills
    )

    required_skills = prepare_skills(
        required_skills
    )


    # -----------------------------------------------------
    # REMOVE EMPTY VALUES
    # -----------------------------------------------------

    resume_skills = [
        skill
        for skill in resume_skills
        if skill and str(skill).strip()
    ]

    required_skills = [
        skill
        for skill in required_skills
        if skill and str(skill).strip()
    ]


    # -----------------------------------------------------
    # DEBUG INFORMATION
    # -----------------------------------------------------

    print(
        "\n========== ATS DEBUG =========="
    )

    print(
        "Resume Skills:",
        resume_skills
    )

    print(
        "Required Job Skills:",
        required_skills
    )


    # -----------------------------------------------------
    # CHECK REQUIRED SKILLS
    # -----------------------------------------------------

    if not required_skills:

        print(
            "ATS RESULT: No required skills"
        )

        print(
            "===============================\n"
        )

        return {
            "ats_score": 0,
            "match_percentage": 0,
            "matched_skills": [],
            "missing_skills": []
        }


    # -----------------------------------------------------
    # CREATE NORMALIZED SETS
    # -----------------------------------------------------

    resume_skill_set = {
        normalize_skill(skill)
        for skill in resume_skills
    }

    required_skill_set = {
        normalize_skill(skill)
        for skill in required_skills
    }


    print(
        "Normalized Resume Skills:",
        resume_skill_set
    )

    print(
        "Normalized Required Skills:",
        required_skill_set
    )


    # -----------------------------------------------------
    # FIND MATCHED SKILLS
    # -----------------------------------------------------

    matched_normalized = (
        resume_skill_set &
        required_skill_set
    )


    # -----------------------------------------------------
    # FIND MISSING SKILLS
    # -----------------------------------------------------

    missing_normalized = (
        required_skill_set -
        resume_skill_set
    )


    # -----------------------------------------------------
    # CALCULATE MATCH PERCENTAGE
    # -----------------------------------------------------

    match_percentage = (
        len(matched_normalized)
        /
        len(required_skill_set)
    ) * 100


    match_percentage = round(
        match_percentage,
        2
    )


    # -----------------------------------------------------
    # ATS SCORE
    # -----------------------------------------------------

    ats_score = match_percentage


    # -----------------------------------------------------
    # KEEP ORIGINAL SKILL NAMES
    # -----------------------------------------------------

    matched_skills = [
        skill
        for skill in required_skills
        if normalize_skill(skill)
        in matched_normalized
    ]


    missing_skills = [
        skill
        for skill in required_skills
        if normalize_skill(skill)
        in missing_normalized
    ]


    # -----------------------------------------------------
    # DEBUG RESULT
    # -----------------------------------------------------

    print(
        "Matched Skills:",
        matched_skills
    )

    print(
        "Missing Skills:",
        missing_skills
    )

    print(
        "ATS Score:",
        ats_score
    )

    print(
        "Match Percentage:",
        match_percentage
    )

    print(
        "===============================\n"
    )


    # -----------------------------------------------------
    # RETURN
    # -----------------------------------------------------

    return {
        "ats_score": ats_score,
        "match_percentage": match_percentage,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills
    }


# =========================================================
# GENERATE SUGGESTIONS
# =========================================================

def generate_suggestions(
    missing_skills: List[str]
) -> str:
    """
    Generate simple suggestions based
    on missing job skills.
    """

    if not missing_skills:

        return (
            "Your resume contains all the "
            "required skills for this job."
        )


    skills_text = ", ".join(
        missing_skills
    )


    return (
        "Consider improving or adding experience "
        f"in the following skills: {skills_text}."
    )
