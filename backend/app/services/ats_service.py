
import json
import re
from typing import List, Any, Optional


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
                    r",|;|\n|\\",
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
            r",|;|\n|\\",
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
# CALCULATE SKILLS MATCH
# =========================================================
def calculate_skills_match(
    resume_skills: List[str],
    required_skills: List[str]
):
    """
    Calculate skill matching percentage.

    Returns:
        skill_match_percentage
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
    # CHECK REQUIRED SKILLS
    # -----------------------------------------------------
    if not required_skills:
        return {
            "skill_match_percentage": 0,
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

    # -----------------------------------------------------
    # REMOVE EMPTY NORMALIZED VALUES
    # -----------------------------------------------------
    resume_skill_set.discard("")
    required_skill_set.discard("")

    if not required_skill_set:
        return {
            "skill_match_percentage": 0,
            "matched_skills": [],
            "missing_skills": []
        }

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
    skill_match_percentage = (
        len(matched_normalized)
        /
        len(required_skill_set)
    ) * 100

    skill_match_percentage = round(
        skill_match_percentage,
        2
    )

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

    return {
        "skill_match_percentage": skill_match_percentage,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills
    }


# =========================================================
# CALCULATE EXPERIENCE MATCH
# =========================================================
def calculate_experience_match(
    resume_experience: Optional[Any],
    required_experience: Optional[Any]
) -> float:
    """
    Calculate experience matching percentage.

    Rules:
    - If job does not specify experience -> 100
    - If candidate meets/exceeds requirement -> 100
    - If candidate has less experience -> proportional score
    """

    # -----------------------------------------------------
    # CONVERT CANDIDATE EXPERIENCE
    # -----------------------------------------------------
    try:
        if resume_experience is None:
            candidate_experience = 0.0
        else:
            candidate_experience = float(
                resume_experience
            )
    except (ValueError, TypeError):
        candidate_experience = 0.0

    # -----------------------------------------------------
    # EXTRACT REQUIRED EXPERIENCE
    # -----------------------------------------------------
    if required_experience is None:
        return 100.0

    required_text = str(
        required_experience
    ).strip().lower()

    if not required_text:
        return 100.0

    # -----------------------------------------------------
    # FIND NUMERIC EXPERIENCE VALUE
    # Examples:
    # "2 years"
    # "3-5 years"
    # "2+ years"
    # -----------------------------------------------------
    numbers = re.findall(
        r"\d+(?:\.\d+)?",
        required_text
    )

    if not numbers:
        return 100.0

    try:
        # For ranges such as "3-5 years",
        # use the minimum required experience.
        required_experience_value = float(
            numbers[0]
        )
    except (ValueError, TypeError):
        return 100.0

    # -----------------------------------------------------
    # NO EXPERIENCE REQUIRED
    # -----------------------------------------------------
    if required_experience_value <= 0:
        return 100.0

    # -----------------------------------------------------
    # CANDIDATE MEETS REQUIREMENT
    # -----------------------------------------------------
    if candidate_experience >= required_experience_value:
        return 100.0

    # -----------------------------------------------------
    # CANDIDATE HAS LESS EXPERIENCE
    # -----------------------------------------------------
    experience_match = (
        candidate_experience
        /
        required_experience_value
    ) * 100

    return round(
        min(experience_match, 100),
        2
    )


# =========================================================
# CALCULATE JOB ROLE / TITLE MATCH
# =========================================================
def calculate_role_match(
    resume_role: Optional[str],
    job_title: Optional[str]
) -> float:
    """
    Calculate similarity between candidate role
    and job title.

    Uses normalized word overlap.

    Job description is NOT used here.
    """

    if not resume_role or not job_title:
        return 50.0

    # -----------------------------------------------------
    # NORMALIZE TEXT
    # -----------------------------------------------------
    resume_role = str(
        resume_role
    ).lower()

    job_title = str(
        job_title
    ).lower()

    # -----------------------------------------------------
    # EXTRACT WORDS
    # -----------------------------------------------------
    resume_words = set(
        re.findall(
            r"[a-z0-9+#.]+",
            resume_role
        )
    )

    job_words = set(
        re.findall(
            r"[a-z0-9+#.]+",
            job_title
        )
    )

    # -----------------------------------------------------
    # REMOVE COMMON GENERIC WORDS
    # -----------------------------------------------------
    generic_words = {
        "developer",
        "engineer",
        "senior",
        "junior",
        "lead",
        "intern",
        "associate",
        "software",
        "technology",
        "technical",
        "the",
        "and",
        "of"
    }

    resume_words -= generic_words
    job_words -= generic_words

    # -----------------------------------------------------
    # CHECK EMPTY VALUES
    # -----------------------------------------------------
    if not resume_words or not job_words:
        return 50.0

    # -----------------------------------------------------
    # CALCULATE WORD OVERLAP
    # -----------------------------------------------------
    matched_words = (
        resume_words &
        job_words
    )

    if not matched_words:
        return 0.0

    role_match = (
        len(matched_words)
        /
        len(job_words)
    ) * 100

    return round(
        min(role_match, 100),
        2
    )


# =========================================================
# CALCULATE LOCATION MATCH
# =========================================================
def calculate_location_match(
    preferred_location: Optional[str],
    job_location: Optional[str]
) -> float:
    """
    Calculate candidate preferred location
    against job location.

    Rules:
    - Missing location information -> 50
    - Remote job -> 100
    - Exact/partial location match -> 100
    - No match -> 0
    """

    if not preferred_location or not job_location:
        return 50.0

    candidate_location = str(
        preferred_location
    ).strip().lower()

    job_location = str(
        job_location
    ).strip().lower()

    if not candidate_location or not job_location:
        return 50.0

    # -----------------------------------------------------
    # REMOTE JOB
    # -----------------------------------------------------
    remote_keywords = {
        "remote",
        "work from home",
        "wfh",
        "anywhere"
    }

    if any(
        keyword in job_location
        for keyword in remote_keywords
    ):
        return 100.0

    # -----------------------------------------------------
    # DIRECT / PARTIAL MATCH
    # -----------------------------------------------------
    if (
        candidate_location in job_location
        or job_location in candidate_location
    ):
        return 100.0

    # -----------------------------------------------------
    # TOKEN-BASED LOCATION MATCH
    # -----------------------------------------------------
    candidate_words = set(
        re.findall(
            r"[a-z]+",
            candidate_location
        )
    )

    job_words = set(
        re.findall(
            r"[a-z]+",
            job_location
        )
    )

    # Remove very generic location terms
    generic_location_words = {
        "india",
        "ind",
        "city",
        "state"
    }

    candidate_words -= generic_location_words
    job_words -= generic_location_words

    if candidate_words & job_words:
        return 100.0

    # -----------------------------------------------------
    # NO LOCATION MATCH
    # -----------------------------------------------------
    return 0.0


# =========================================================
# CALCULATE ATS SCORE
# =========================================================
def calculate_ats_score(
    resume_skills: List[str],
    required_skills: List[str],
    resume_experience: Optional[Any] = None,
    required_experience: Optional[Any] = None,
    resume_role: Optional[str] = None,
    job_title: Optional[str] = None,
    preferred_location: Optional[str] = None,
    job_location: Optional[str] = None
):
    """
    Calculate the final ATS score using four criteria.

    Weights:
        Skills Match       = 55%
        Experience Match   = 20%
        Role/Title Match   = 15%
        Location Match     = 10%

    Total = 100%

    Job description matching is NOT included.
    Education matching is NOT included.
    Resume completeness is NOT included.

    The original function arguments remain supported.
    """

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

    print(
        "Resume Experience:",
        resume_experience
    )

    print(
        "Required Experience:",
        required_experience
    )

    print(
        "Resume Role:",
        resume_role
    )

    print(
        "Job Title:",
        job_title
    )

    print(
        "Preferred Location:",
        preferred_location
    )

    print(
        "Job Location:",
        job_location
    )

    # -----------------------------------------------------
    # SKILLS MATCH
    # -----------------------------------------------------
    skills_result = calculate_skills_match(
        resume_skills,
        required_skills
    )

    skill_match_percentage = skills_result[
        "skill_match_percentage"
    ]

    matched_skills = skills_result[
        "matched_skills"
    ]

    missing_skills = skills_result[
        "missing_skills"
    ]

    # -----------------------------------------------------
    # EXPERIENCE MATCH
    # -----------------------------------------------------
    experience_match = calculate_experience_match(
        resume_experience,
        required_experience
    )

    # -----------------------------------------------------
    # ROLE / TITLE MATCH
    # -----------------------------------------------------
    role_match = calculate_role_match(
        resume_role,
        job_title
    )

    # -----------------------------------------------------
    # LOCATION MATCH
    # -----------------------------------------------------
    location_match = calculate_location_match(
        preferred_location,
        job_location
    )

    # -----------------------------------------------------
    # WEIGHTED ATS SCORE
    # -----------------------------------------------------
    ats_score = (
        (skill_match_percentage * 0.55)
        +
        (experience_match * 0.20)
        +
        (role_match * 0.15)
        +
        (location_match * 0.10)
    )

    ats_score = round(
        max(0, min(ats_score, 100)),
        2
    )

    # -----------------------------------------------------
    # MATCH PERCENTAGE
    # -----------------------------------------------------
    match_percentage = ats_score

    # -----------------------------------------------------
    # DEBUG RESULT
    # -----------------------------------------------------
    print(
        "\n----- ATS COMPONENT SCORES -----"
    )

    print(
        "Skills Match:",
        skill_match_percentage,
        "/ 100",
        "(Weight: 55%)"
    )

    print(
        "Experience Match:",
        experience_match,
        "/ 100",
        "(Weight: 20%)"
    )

    print(
        "Role/Title Match:",
        role_match,
        "/ 100",
        "(Weight: 15%)"
    )

    print(
        "Location Match:",
        location_match,
        "/ 100",
        "(Weight: 10%)"
    )

    print(
        "--------------------------------"
    )

    print(
        "Final ATS Score:",
        ats_score
    )

    print(
        "Match Percentage:",
        match_percentage
    )

    print(
        "Matched Skills:",
        matched_skills
    )

    print(
        "Missing Skills:",
        missing_skills
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
        "missing_skills": missing_skills,

        # Additional breakdown
        # These do not remove any existing fields.
        "skills_match": skill_match_percentage,
        "experience_match": experience_match,
        "role_match": role_match,
        "location_match": location_match
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
