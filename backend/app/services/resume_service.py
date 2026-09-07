import re


# =========================================================
# NORMALIZE TEXT
# =========================================================

def normalize_text(text: str) -> str:
    """
    Normalize resume text while preserving
    useful line breaks and content.
    """

    if not text:
        return ""

    text = text.replace(
        "\u00a0",
        " "
    )

    # Normalize different dash characters
    text = text.replace(
        "\u2013",
        "-"
    ).replace(
        "\u2014",
        "-"
    )

    # Remove excessive spaces/tabs
    text = re.sub(
        r"[ \t]+",
        " ",
        text
    )

    # Remove excessive blank lines
    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text
    )

    return text.strip()


# =========================================================
# KNOWN SKILLS
# =========================================================

KNOWN_SKILLS = [
    "C",
    "C++",
    "C#",
    "Java",
    "JavaScript",
    "TypeScript",
    "Python",
    "React",
    "React Native",
    "Angular",
    "Vue.js",
    "Node.js",
    "Express.js",
    "Django",
    "FastAPI",
    "HTML",
    "HTML5",
    "CSS",
    "CSS3",
    "Tailwind CSS",
    "Bootstrap",
    "SQL",
    "MySQL",
    "PostgreSQL",
    "MongoDB",
    "Git",
    "GitHub",
    "GitHub Actions",
    "Docker",
    "AWS",
    "Azure",
    "Machine Learning",
    "Deep Learning",
    "Natural Language Processing",
    "Data Science",
    "Data Analysis",
    "scikit-learn",
    "TensorFlow",
    "PyTorch",
    "Figma",
    "UI/UX Design",
    "REST API",
    "GraphQL",
    "Flutter",
    "Kotlin",
    "Firebase",
    "Next.js",
    "Vercel",
    "Slack",
    "Notion",
    "Jira",
]


# =========================================================
# EXTRACT SKILLS
# =========================================================

def extract_skills(text: str):
    """
    Extract known skills automatically from
    the complete resume text.
    """

    normalized_text = normalize_text(
        text
    )

    if not normalized_text:
        return []

    found_skills = []

    for skill in KNOWN_SKILLS:

        pattern = (
            r"(?<![A-Za-z0-9])"
            + re.escape(skill)
            + r"(?![A-Za-z0-9])"
        )

        if re.search(
            pattern,
            normalized_text,
            flags=re.IGNORECASE
        ):

            found_skills.append(
                skill
            )

    return found_skills


# =========================================================
# EXTRACT SUMMARY
# =========================================================

def extract_summary(text: str):
    """
    Extract the Professional Summary / Profile section.
    """

    if not text:
        return ""

    pattern = re.compile(
        r"(?:professional\s+summary|"
        r"summary|"
        r"profile)"
        r"\s*:?\s*"
        r"(.*?)"
        r"(?=\n\s*(?:core\s+skills|"
        r"skills|"
        r"technical\s+skills|"
        r"professional\s+experience|"
        r"work\s+experience|"
        r"experience|"
        r"employment\s+history|"
        r"projects|"
        r"education|"
        r"certifications)\b)",
        flags=re.IGNORECASE | re.DOTALL
    )

    match = pattern.search(
        text
    )

    if not match:
        return ""

    return normalize_text(
        match.group(1)
    )


# =========================================================
# DATE RANGE PATTERN
# =========================================================

DATE_RANGE_PATTERN = re.compile(
    r"\b("
    r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
    r"\.?\s+\d{4}"
    r"\s*-\s*"
    r"(?:"
    r"Present|"
    r"Current|"
    r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
    r"\.?\s+\d{4}"
    r")"
    r"|"
    r"\d{4}"
    r"\s*-\s*"
    r"(?:Present|Current|\d{4})"
    r")\b",
    flags=re.IGNORECASE
)


# =========================================================
# EXPERIENCE SECTION
# =========================================================

def extract_experience_section(text: str):
    """
    Extract only the Professional Experience section.
    """

    if not text:
        return ""

    pattern = re.compile(
        r"(?:professional\s+experience|"
        r"work\s+experience|"
        r"employment\s+history)"
        r"\s*:?\s*"
        r"(.*?)"
        r"(?=\n\s*(?:projects|"
        r"education|"
        r"certifications|"
        r"skills|"
        r"technical\s+skills|"
        r"achievements|"
        r"awards)\b|$)",
        flags=re.IGNORECASE | re.DOTALL
    )

    match = pattern.search(
        text
    )

    if not match:
        return ""

    return normalize_text(
        match.group(1)
    )


# =========================================================
# CLEAN EXPERIENCE TITLE
# =========================================================

def clean_job_title(title: str):
    """
    Clean common formatting from job titles.
    """

    if not title:
        return ""

    title = normalize_text(
        title
    )

    # Remove leading bullets
    title = re.sub(
        r"^[•●▪◦\-]+\s*",
        "",
        title
    )

    # Remove trailing separators
    title = re.sub(
        r"\s*[-|]\s*$",
        "",
        title
    )

    return title.strip()


# =========================================================
# EXTRACT COMPANY FROM TITLE LINE
# =========================================================

def split_title_and_company(line: str):
    """
    Try to split a combined experience heading.

    Examples:

        Remote Software Engineer - Product-Based Startup

    becomes:

        job_title = Remote Software Engineer
        company   = Product-Based Startup
    """

    if not line:
        return "", ""

    line = clean_job_title(
        line
    )

    # Most common separator
    separators = [
        " - ",
        " – ",
        " — ",
        " | ",
    ]

    for separator in separators:

        if separator in line:

            parts = [
                part.strip()
                for part in line.split(
                    separator,
                    1
                )
            ]

            if len(parts) == 2:

                return (
                    clean_job_title(
                        parts[0]
                    ),
                    clean_job_title(
                        parts[1]
                    ),
                )

    return (
        clean_job_title(line),
        ""
    )


# =========================================================
# CHECK IF LINE LOOKS LIKE DESCRIPTION
# =========================================================

def is_description_line(line: str):
    """
    Detect whether a line is likely a job description
    rather than a title/company.
    """

    if not line:
        return True

    lower = line.lower().strip()

    description_starts = (
        "built ",
        "designed ",
        "developed ",
        "created ",
        "implemented ",
        "integrated ",
        "worked ",
        "managed ",
        "maintained ",
        "led ",
        "documented ",
        "responsible ",
        "collaborated ",
        "developed ",
        "using ",
        "created ",
    )

    if lower.startswith(
        description_starts
    ):
        return True

    return False


# =========================================================
# EXTRACT EXPERIENCE
# =========================================================

def extract_experience(text: str):
    """
    Extract professional experience.

    Handles common formats such as:

        Remote Software Engineer - Product-Based Startup
        Jan 2023 - Present
        Built and maintained...
        Designed responsive...
    """

    if not text:
        return []

    experience_section = (
        extract_experience_section(
            text
        )
    )

    if not experience_section:
        return []

    # -----------------------------------------------------
    # Preserve lines before normalization
    # -----------------------------------------------------

    raw_lines = experience_section.split(
        "\n"
    )

    lines = []

    for line in raw_lines:

        line = line.strip()

        if not line:
            continue

        line = re.sub(
            r"^[•●▪◦]+\s*",
            "",
            line
        )

        lines.append(
            line.strip()
        )

    if not lines:
        return []

    # -----------------------------------------------------
    # Find date ranges
    # -----------------------------------------------------

    date_matches = list(
        DATE_RANGE_PATTERN.finditer(
            experience_section
        )
    )

    experiences = []

    # =====================================================
    # FORMAT 1
    #
    # Heading
    # Date
    # Description
    # =====================================================

    if date_matches:

        for index, date_match in enumerate(
            date_matches
        ):

            date_range = (
                date_match.group(1)
                .strip()
            )

            # Text before this date
            previous_end = (
                date_matches[index - 1].end()
                if index > 0
                else 0
            )

            before_date = (
                experience_section[
                    previous_end:
                    date_match.start()
                ]
            )

            before_date = before_date.strip()

            # -------------------------------------------------
            # Text after date
            # -------------------------------------------------

            next_start = (
                date_matches[index + 1].start()
                if index + 1 < len(date_matches)
                else len(experience_section)
            )

            after_date = (
                experience_section[
                    date_match.end():
                    next_start
                ]
            ).strip()

            # -------------------------------------------------
            # Find heading
            # -------------------------------------------------

            heading_lines = [
                line.strip()
                for line in before_date.split(
                    "\n"
                )
                if line.strip()
            ]

            title = ""
            company = ""

            if heading_lines:

                # Usually the final line before
                # the date is the experience heading.
                heading = heading_lines[-1]

                title, company = (
                    split_title_and_company(
                        heading
                    )
                )

                # -------------------------------------------------
                # If the heading does not contain company,
                # check the previous line.
                # -------------------------------------------------

                if not company and len(
                    heading_lines
                ) >= 2:

                    possible_company = (
                        heading_lines[-2]
                    )

                    if not is_description_line(
                        possible_company
                    ):

                        company = (
                            clean_job_title(
                                possible_company
                            )
                        )

            # -------------------------------------------------
            # Extract description
            # -------------------------------------------------

            description_lines = []

            for line in after_date.split(
                "\n"
            ):

                line = line.strip()

                if not line:
                    continue

                # Stop if another obvious section
                # accidentally appears.
                if re.match(
                    r"^(projects|education|"
                    r"certifications|skills|"
                    r"technical skills|"
                    r"achievements|awards)$",
                    line,
                    flags=re.IGNORECASE
                ):
                    break

                description_lines.append(
                    line
                )

            description = " ".join(
                description_lines
            )

            description = normalize_text(
                description
            )

            # -------------------------------------------------
            # If title is empty, try to infer it
            # -------------------------------------------------

            if not title:

                job_title_pattern = re.compile(
                    r"\b("
                    r"software\s+engineer|"
                    r"software\s+developer|"
                    r"web\s+developer|"
                    r"backend\s+developer|"
                    r"frontend\s+developer|"
                    r"full\s+stack\s+developer|"
                    r"full\s+stack\s+engineer|"
                    r"data\s+scientist|"
                    r"data\s+analyst|"
                    r"machine\s+learning\s+engineer|"
                    r"developer|"
                    r"engineer|"
                    r"intern"
                    r")\b",
                    flags=re.IGNORECASE
                )

                title_match = (
                    job_title_pattern.search(
                        before_date
                    )
                )

                if title_match:

                    title = (
                        title_match.group(0)
                    )

            # -------------------------------------------------
            # Add experience
            # -------------------------------------------------

            if title or company or description:

                experiences.append(
                    {
                        "job_title":
                            title,

                        "company":
                            company,

                        "date_range":
                            date_range,

                        "description":
                            description,
                    }
                )

    # =====================================================
    # FORMAT 2
    #
    # No date range
    # Try common job titles.
    # =====================================================

    if not experiences:

        job_title_pattern = re.compile(
            r"\b("
            r"software\s+engineer|"
            r"software\s+developer|"
            r"web\s+developer|"
            r"backend\s+developer|"
            r"frontend\s+developer|"
            r"full\s+stack\s+developer|"
            r"full\s+stack\s+engineer|"
            r"data\s+scientist|"
            r"data\s+analyst|"
            r"machine\s+learning\s+engineer|"
            r"developer|"
            r"engineer|"
            r"intern"
            r")\b",
            flags=re.IGNORECASE
        )

        match = job_title_pattern.search(
            experience_section
        )

        if match:

            title = match.group(
                0
            )

            description = (
                experience_section
            )

            experiences.append(
                {
                    "job_title":
                        title,

                    "company":
                        "",

                    "date_range":
                        "",

                    "description":
                        description,
                }
            )

    return experiences


# =========================================================
# EXTRACT EXPERIENCE YEARS
# =========================================================

def extract_experience_years(text: str):
    """
    Extract explicit years of experience.

    Example:

        5+ years of experience

    Returns:

        5.0
    """

    if not text:
        return None

    pattern = re.compile(
        r"(\d+(?:\.\d+)?)\s*\+?\s*"
        r"(?:years?|yrs?)"
        r"(?:\s+of)?\s+experience",
        flags=re.IGNORECASE
    )

    matches = pattern.findall(
        text
    )

    if not matches:
        return None

    try:

        return float(
            matches[0]
        )

    except (
        ValueError,
        TypeError
    ):

        return None


# =========================================================
# EXTRACT EDUCATION SECTION
# =========================================================

def extract_education_section(text: str):
    """
    Extract only the Education section.
    """

    if not text:
        return ""

    pattern = re.compile(
        r"(?:education|"
        r"academic\s+background|"
        r"educational\s+qualification)"
        r"\s*:?\s*"
        r"(.*?)"
        r"(?=\n\s*(?:certifications|"
        r"projects|"
        r"professional\s+experience|"
        r"work\s+experience|"
        r"experience|"
        r"skills|"
        r"achievements|"
        r"awards)\b|$)",
        flags=re.IGNORECASE | re.DOTALL
    )

    match = pattern.search(
        text
    )

    if not match:
        return ""

    return normalize_text(
        match.group(1)
    )


# =========================================================
# EXTRACT EDUCATION
# =========================================================

def extract_education(text: str):
    """
    Extract degree, field, institution and year
    from common resume education formats.
    """

    if not text:
        return []

    education_section = (
        extract_education_section(
            text
        )
    )

    if not education_section:
        return []

    education = []

    # -----------------------------------------------------
    # Degree patterns
    # -----------------------------------------------------

    degree_pattern = re.compile(
        r"\b("
        r"B\.?\s*Tech|"
        r"B\.?\s*E\.?|"
        r"B\.?\s*Sc|"
        r"Bachelor(?:'s)?|"
        r"M\.?\s*Tech|"
        r"M\.?\s*E\.?|"
        r"M\.?\s*Sc|"
        r"Master(?:'s)?|"
        r"MBA|"
        r"MCA|"
        r"BCA|"
        r"Ph\.?\s*D|"
        r"Diploma"
        r")"
        r"(?:\s+in\s+([A-Za-z &/.-]+))?",
        flags=re.IGNORECASE
    )

    degree_matches = list(
        degree_pattern.finditer(
            education_section
        )
    )

    # -----------------------------------------------------
    # Institution
    # -----------------------------------------------------

    institution_pattern = re.compile(
        r"\b("
        r"[A-Z][A-Za-z&.\- ]+"
        r"(?:University|College|Institute|"
        r"School|Academy)"
        r")\b"
    )

    institution_match = (
        institution_pattern.search(
            education_section
        )
    )

    institution = (
        institution_match.group(1).strip()
        if institution_match
        else ""
    )

    # -----------------------------------------------------
    # Year range
    # -----------------------------------------------------

    year_pattern = re.compile(
        r"\b("
        r"(?:19|20)\d{2}"
        r"\s*-\s*"
        r"(?:"
        r"(?:19|20)\d{2}"
        r"|Present"
        r"|Current"
        r")"
        r")\b",
        flags=re.IGNORECASE
    )

    year_match = year_pattern.search(
        education_section
    )

    year_range = (
        year_match.group(1)
        if year_match
        else ""
    )

    # -----------------------------------------------------
    # Build education records
    # -----------------------------------------------------

    for match in degree_matches:

        degree = (
            match.group(1)
            .strip()
        )

        field = (
            match.group(2).strip()
            if match.group(2)
            else ""
        )

        education.append(
            {
                "degree":
                    degree,

                "field":
                    field,

                "institution":
                    institution,

                "year":
                    year_range,
            }
        )

    # -----------------------------------------------------
    # Fallback
    # -----------------------------------------------------

    if not education:

        education.append(
            {
                "degree":
                    "",

                "field":
                    "",

                "institution":
                    institution,

                "year":
                    year_range,

                "details":
                    education_section,
            }
        )

    return education


# =========================================================
# COMPLETE RESUME PARSER
# =========================================================

def parse_resume(text: str):
    """
    Main resume parsing function.

    Returns:

        resume_text
        extracted_skills
        extracted_experience
        experience_years
        extracted_education
        summary
    """

    normalized_text = normalize_text(
        text
    )

    skills = extract_skills(
        normalized_text
    )

    experience = extract_experience(
        normalized_text
    )

    experience_years = (
        extract_experience_years(
            normalized_text
        )
    )

    education = extract_education(
        normalized_text
    )

    summary = extract_summary(
        normalized_text
    )

    return {
        "resume_text":
            normalized_text,

        "extracted_skills":
            skills,

        "extracted_experience":
            experience,

        "experience_years":
            experience_years,

        "extracted_education":
            education,

        "summary":
            summary,
    }
