import re

SKILL_WEIGHT = 0.60
EXPERIENCE_WEIGHT = 0.30
EDUCATION_WEIGHT = 0.10

# =========================================================
# SKILL NORMALIZATION
# =========================================================

def normalize_skill(skill):
    """
    Normalize a skill so resume and job skills
    can be compared reliably.
    """

    if not skill:
        return ""

    skill = str(skill).strip().lower()

    skill = skill.replace("_", " ")
    skill = re.sub(r"\s+", " ", skill)

    replacements = {
        # JavaScript
        "java script": "javascript",

        # React
        "react.js": "react",
        "reactjs": "react",
        "react js": "react",

        # Angular
        "angular.js": "angular",
        "angularjs": "angular",
        "angular js": "angular",

        # Vue
        "vue.js": "vue",
        "vuejs": "vue",
        "vue js": "vue",

        # Node
        "node.js": "nodejs",
        "node js": "nodejs",

        # TypeScript
        "type script": "typescript",

        # CSS
        "css3": "css",

        # HTML
        "html5": "html",

        # PostgreSQL
        "postgres": "postgresql",

        # REST
        "rest api": "rest apis",
        "restful api": "rest apis",
        "restful apis": "rest apis",

        # OOP
        "oop": "object oriented programming",
        "object-oriented programming": "object oriented programming",

        # Data structures
        "data structures & algorithms":
            "data structures and algorithms",

        "data structures & algorithm":
            "data structures and algorithms",

        # Machine learning
        "machine-learning": "machine learning",

        # AWS
        "amazon web services": "aws",
    }

    return replacements.get(skill, skill)


def normalize_skills(skills):
    """
    Normalize a list of skills and remove duplicates.
    """

    normalized = []
    seen = set()

    for skill in skills or []:

        skill = normalize_skill(skill)

        if not skill:
            continue

        if skill not in seen:
            seen.add(skill)
            normalized.append(skill)

    return normalized


# =========================================================
# SKILL MATCHING
# =========================================================

def match_skills(resume_skills, job_skills):
    """
    Compare resume skills with job required skills.
    """

    resume_skills = normalize_skills(resume_skills)
    job_skills = normalize_skills(job_skills)

    resume_set = set(resume_skills)
    job_set = set(job_skills)

    matched_skills = sorted(
        resume_set.intersection(job_set)
    )

    missing_skills = sorted(
        job_set.difference(resume_set)
    )

    if not job_set:

        match_percentage = 0.0

    else:

        match_percentage = round(
            (len(matched_skills) / len(job_set)) * 100,
            2
        )

    return {
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "match_percentage": match_percentage,
    }


# =========================================================
# EXPERIENCE
# =========================================================

def extract_years_required(text):
    """
    Extract the maximum years of experience mentioned.

    Examples:

        3+ years experience -> 3
        2-4 years experience -> 4
        5 years experience -> 5
    """

    if not text:
        return 0

    text = str(text).lower()

    matches = re.findall(
        r"(\d+)\s*(?:-\s*(\d+))?\+?\s*(?:years?|yrs?)",
        text
    )

    years = []

    for match in matches:

        first = int(match[0])

        if match[1]:

            second = int(match[1])
            years.append(second)

        else:

            years.append(first)

    return max(years, default=0)


def extract_experience_text(experience):
    """
    Convert Resume.experience JSON data into
    one searchable text string.
    """

    if not experience:
        return ""

    if isinstance(experience, list):

        return " ".join(
            str(item)
            for item in experience
        )

    return str(experience)


def match_experience(resume, job):
    """
    Compare candidate experience with job requirements.
    """

    resume_experience = extract_experience_text(
        resume.experience
    )

    job_text = " ".join([
        str(job.experience_level or ""),
        str(job.description or "")
    ])

    required_years = extract_years_required(
        job_text
    )

    resume_text_lower = resume_experience.lower()
    job_text_lower = job_text.lower()

    experience_keywords = [

        "software development",
        "software engineering",
        "web development",

        "frontend",
        "front-end",

        "backend",
        "back-end",

        "full stack",
        "full-stack",

        "data analysis",
        "data science",

        "machine learning",
        "artificial intelligence",

        "gis",

        "java",
        "python",
        "javascript",

        "angular",
        "react",
        "flask",
        "django",

        "sql",
        "mysql",
        "postgresql",
        "mongodb",

        "api",
        "rest",

        "testing",
        "debugging",

        "cloud",
        "aws",
        "azure",

        "docker",
        "kubernetes",
    ]

    matched_experience_keywords = []

    for keyword in experience_keywords:

        if (
            keyword in job_text_lower
            and keyword in resume_text_lower
        ):

            matched_experience_keywords.append(
                keyword
            )

    if matched_experience_keywords:

        relevance_score = min(
            len(matched_experience_keywords) * 20,
            100
        )

    else:

        relevance_score = 0

    if not resume_experience:

        experience_status = (
            "No experience information available."
        )

    elif required_years == 0:

        if relevance_score > 0:

            experience_status = (
                "Relevant experience found."
            )

        else:

            experience_status = (
                "Experience found, but relevance "
                "is unclear."
            )

    else:

        experience_status = (
            f"Job requires approximately "
            f"{required_years}+ years of experience. "
            f"Candidate experience should be reviewed "
            f"for seniority."
        )

    return {

        "required_years":
            required_years,

        "matched_experience_keywords":
            sorted(
                matched_experience_keywords
            ),

        "experience_relevance_score":
            relevance_score,

        "experience_status":
            experience_status,
    }


# =========================================================
# EDUCATION
# =========================================================

def extract_education_text(education):
    """
    Convert Resume.education JSON data into
    one searchable text string.
    """

    if not education:
        return ""

    if isinstance(education, list):

        return " ".join(
            str(item)
            for item in education
        )

    return str(education)


def normalize_education_text(text):
    """
    Normalize education text while preserving
    useful degree information.
    """

    if not text:
        return ""

    text = str(text).lower()

    # HTML entities
    text = text.replace(
        "&amp;",
        "and"
    )

    # Normalize ampersand
    text = text.replace(
        "&",
        " and "
    )

    # Normalize slashes
    text = text.replace(
        "/",
        " "
    )

    # Normalize hyphens
    text = text.replace(
        "-",
        " "
    )

    # Normalize punctuation
    text = text.replace(
        ".",
        " "
    )

    # Remove duplicate whitespace
    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()


# =========================================================
# DETECT EDUCATION LEVEL
# =========================================================

def detect_education_levels(text):
    """
    Detect degree levels from education text.

    Returns values such as:

        bachelor
        master
        phd
        diploma
    """

    text = normalize_education_text(text)

    levels = set()

    # -----------------------------------------------------
    # BACHELOR
    # -----------------------------------------------------

    bachelor_patterns = [

        r"\bbachelor\b",

        r"\bbachelors\b",

        r"\bbachelor degree\b",

        r"\bbachelor of technology\b",

        r"\bbachelor of engineering\b",

        r"\bb tech\b",

        r"\bbtech\b",

        r"\bb e\b",

        r"\bbe\b",
    ]

    for pattern in bachelor_patterns:

        if re.search(pattern, text):

            levels.add("bachelor")
            break

    # -----------------------------------------------------
    # MASTER
    # -----------------------------------------------------

    master_patterns = [

        r"\bmaster\b",

        r"\bmasters\b",

        r"\bmaster degree\b",

        r"\bmaster of technology\b",

        r"\bmaster of engineering\b",

        r"\bmaster of science\b",

        r"\bm tech\b",

        r"\bmtech\b",

        r"\bm e\b",

        r"\bme\b",

        r"\bmba\b",

        r"\bmsc\b",

        r"\bm sc\b",
    ]

    for pattern in master_patterns:

        if re.search(pattern, text):

            levels.add("master")
            break

    # -----------------------------------------------------
    # PhD
    # -----------------------------------------------------

    phd_patterns = [

        r"\bphd\b",

        r"\bph d\b",

        r"\bdoctor of philosophy\b",
    ]

    for pattern in phd_patterns:

        if re.search(pattern, text):

            levels.add("phd")
            break

    # -----------------------------------------------------
    # DIPLOMA
    # -----------------------------------------------------

    diploma_patterns = [

        r"\bdiploma\b",

        r"\bpolytechnic\b",
    ]

    for pattern in diploma_patterns:

        if re.search(pattern, text):

            levels.add("diploma")
            break

    return levels


# =========================================================
# EDUCATION FIELD DETECTION
# =========================================================

def detect_education_fields(text):
    """
    Detect common education fields.
    """

    text = normalize_education_text(text)

    fields = set()

    field_patterns = {

        "computer science": [
            r"\bcomputer science\b",
            r"\bcomputer science engineering\b",
            r"\bcse\b",
        ],

        "information technology": [
            r"\binformation technology\b",
            r"\binformation tech\b",
            r"\bit\b",
        ],

        "electronics": [
            r"\belectronics\b",
            r"\bece\b",
            r"\belectrical and electronics\b",
        ],

        "electrical": [
            r"\belectrical engineering\b",
            r"\beee\b",
        ],

        "mechanical": [
            r"\bmechanical engineering\b",
            r"\bmechanical\b",
        ],

        "civil": [
            r"\bcivil engineering\b",
            r"\bcivil\b",
        ],

        "data science": [
            r"\bdata science\b",
        ],

        "mathematics": [
            r"\bmathematics\b",
            r"\bmaths\b",
        ],

        "physics": [
            r"\bphysics\b",
        ],

        "chemistry": [
            r"\bchemistry\b",
        ],
    }

    for field, patterns in field_patterns.items():

        for pattern in patterns:

            if re.search(pattern, text):

                fields.add(field)
                break

    return fields


# =========================================================
# EDUCATION REQUIREMENT DETECTION
# =========================================================

def detect_required_education(job_text):
    """
    Detect actual education requirements from
    the job description.
    """

    text = normalize_education_text(
        job_text
    )

    required_levels = set()
    required_fields = set()

    # -----------------------------------------------------
    # BACHELOR REQUIREMENT
    # -----------------------------------------------------

    bachelor_patterns = [

        r"\bbe\s*/?\s*b\s*tech\b",

        r"\bb\s*tech\b",

        r"\bbtech\b",

        r"\bbachelor\b",

        r"\bbachelor degree\b",

        r"\bbachelor of technology\b",

        r"\bbachelor of engineering\b",

        r"\bbachelor's\b",

        r"\bbachelors\b",
    ]

    for pattern in bachelor_patterns:

        if re.search(pattern, text):

            required_levels.add(
                "bachelor"
            )

            break

    # -----------------------------------------------------
    # MASTER REQUIREMENT
    # -----------------------------------------------------

    master_patterns = [

        r"\bmaster\b",

        r"\bmaster degree\b",

        r"\bmaster's\b",

        r"\bmasters\b",

        r"\bm\s*tech\b",

        r"\bmtech\b",

        r"\bm\s*e\b",

        r"\bme\b",

        r"\bmba\b",

        r"\bmsc\b",
    ]

    for pattern in master_patterns:

        if re.search(pattern, text):

            required_levels.add(
                "master"
            )

            break

    # -----------------------------------------------------
    # PHD
    # -----------------------------------------------------

    phd_patterns = [

        r"\bphd\b",

        r"\bph d\b",

        r"\bdoctor of philosophy\b",
    ]

    for pattern in phd_patterns:

        if re.search(pattern, text):

            required_levels.add(
                "phd"
            )

            break

    # -----------------------------------------------------
    # DIPLOMA
    # -----------------------------------------------------

    if re.search(
        r"\bdiploma\b|\bpolytechnic\b",
        text
    ):

        required_levels.add(
            "diploma"
        )

    # -----------------------------------------------------
    # FIELDS
    # -----------------------------------------------------

    required_fields = detect_education_fields(
        text
    )

    return (
        required_levels,
        required_fields
    )


# =========================================================
# EDUCATION MATCHING
# =========================================================

def match_education(resume, job):
    """
    Match candidate education against
    education requirements in the job.

    Education evaluation considers:

        1. Degree level
        2. Education field

    If the job does not specify education,
    education is treated as satisfied.
    """

    resume_education = extract_education_text(
        resume.education
    )

    job_text = " ".join([
        str(job.title or ""),
        str(job.description or ""),
        str(job.experience_level or "")
    ])

    # -----------------------------------------------------
    # NO RESUME EDUCATION
    # -----------------------------------------------------

    if not resume_education:

        return {

            "education_score": 0.0,

            "matched_education_keywords": [],

            "education_status":
                "No education information available.",
        }

    # -----------------------------------------------------
    # DETECT REQUIREMENTS
    # -----------------------------------------------------

    required_levels, required_fields = (
        detect_required_education(
            job_text
        )
    )

    # -----------------------------------------------------
    # NO EDUCATION REQUIREMENT
    # -----------------------------------------------------

    if not required_levels and not required_fields:

        return {

            "education_score": 100.0,

            "matched_education_keywords": [],

            "education_status":
                "No specific education requirement found.",
        }

    # -----------------------------------------------------
    # DETECT CANDIDATE EDUCATION
    # -----------------------------------------------------

    candidate_levels = detect_education_levels(
        resume_education
    )

    candidate_fields = detect_education_fields(
        resume_education
    )

    # -----------------------------------------------------
    # LEVEL MATCH
    # -----------------------------------------------------

    matched_levels = (
        required_levels
        .intersection(candidate_levels)
    )

    # -----------------------------------------------------
    # FIELD MATCH
    # -----------------------------------------------------

    matched_fields = (
        required_fields
        .intersection(candidate_fields)
    )

    # -----------------------------------------------------
    # CALCULATE EDUCATION SCORE
    # -----------------------------------------------------

    score_parts = []

    matched_keywords = []

    # Degree level
    if required_levels:

        if matched_levels:

            score_parts.append(70)

            matched_keywords.extend(
                sorted(matched_levels)
            )

        else:

            score_parts.append(0)

    # Field
    if required_fields:

        if matched_fields:

            score_parts.append(30)

            matched_keywords.extend(
                sorted(matched_fields)
            )

        else:

            score_parts.append(0)

    # -----------------------------------------------------
    # SPECIAL CASE
    # -----------------------------------------------------
    # If the job specifies only a degree and candidate
    # has the correct degree, score should be 100.
    # -----------------------------------------------------

    if (
        required_levels
        and not required_fields
        and matched_levels
    ):

        education_score = 100.0

    elif (
        required_fields
        and not required_levels
        and matched_fields
    ):

        education_score = 100.0

    else:

        education_score = float(
            sum(score_parts)
        )

    # -----------------------------------------------------
    # STATUS
    # -----------------------------------------------------

    if education_score == 100:

        education_status = (
            "Candidate education matches "
            "the job requirement."
        )

    elif education_score > 0:

        education_status = (
            "Candidate partially matches "
            "the job education requirement."
        )

    else:

        education_status = (
            "Candidate education does not "
            "match the job requirement."
        )

    return {

        "education_score":
            education_score,

        "matched_education_keywords":
            sorted(
                set(matched_keywords)
            ),

        "education_status":
            education_status,
    }


# =========================================================
# MAIN ATS MATCHER
# =========================================================

def match_resume_to_job(resume, job):
    """
    Main ATS matching function.

    Currently evaluates:

        1. Skills
        2. Experience
        3. Education

    Final ATS weighting will be:

        Skills      = 60%
        Experience  = 30%
        Education   = 10%

    The final weighted score is intentionally
    not calculated until all three components
    are verified.
    """

    if resume is None:

        raise ValueError(
            "Resume is required."
        )

    if job is None:

        raise ValueError(
            "Job is required."
        )

    # -----------------------------------------------------
    # SKILLS
    # -----------------------------------------------------

    skill_result = match_skills(
        resume.skills or [],
        job.required_skills or []
    )

    # -----------------------------------------------------
    # EXPERIENCE
    # -----------------------------------------------------

    experience_result = match_experience(
        resume,
        job
    )

    # -----------------------------------------------------
    # EDUCATION
    # -----------------------------------------------------

    education_result = match_education(
        resume,
        job
    )

    # -----------------------------------------------------
    # FINAL ATS SCORE
    # -----------------------------------------------------

    final_ats_score = round(
        (
            skill_result["match_percentage"] * SKILL_WEIGHT
            + experience_result["experience_relevance_score"] * EXPERIENCE_WEIGHT
            + education_result["education_score"] * EDUCATION_WEIGHT
        ),
        2
    )

    # -----------------------------------------------------
    # RETURN RESULT
    # -----------------------------------------------------

    return {

        "job_id":
            job.job_id,

        "job_title":
            job.title,

        # -------------------------------------------------
        # SKILLS
        # -------------------------------------------------

        "matched_skills":
            skill_result[
                "matched_skills"
            ],

        "missing_skills":
            skill_result[
                "missing_skills"
            ],

        "skill_match_percentage":
            skill_result[
                "match_percentage"
            ],

        # -------------------------------------------------
        # EXPERIENCE
        # -------------------------------------------------

        "required_experience_years":
            experience_result[
                "required_years"
            ],

        "matched_experience_keywords":
            experience_result[
                "matched_experience_keywords"
            ],

        "experience_relevance_score":
            experience_result[
                "experience_relevance_score"
            ],

        "experience_status":
            experience_result[
                "experience_status"
            ],

        # -------------------------------------------------
        # EDUCATION
        # -------------------------------------------------

        "education_score":
            education_result[
                "education_score"
            ],

        "matched_education_keywords":
            education_result[
                "matched_education_keywords"
            ],

        "education_status":
            education_result[
                "education_status"
            ],
         # -------------------------------------------------
        # FINAL ATS SCORE
        # -------------------------------------------------

        "final_ats_score":
            final_ats_score,
    }