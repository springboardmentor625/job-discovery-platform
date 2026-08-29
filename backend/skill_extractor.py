
import re
import json
import os


# ============================================================
# SKILL SECTION CONFIGURATION
# ============================================================

SKILL_SECTION_HEADINGS = [
    "skills",
    "technical skills",
    "technical expertise",
    "core skills",
    "key skills",
    "skills & technologies",
    "technical proficiency",
    "tools & technologies",
]


NEXT_SECTIONS = [
    "education",
    "experience",
    "work experience",
    "professional experience",
    "projects",
    "certifications",
    "achievements",
    "summary",
    "objective",
    "languages",
    "interests",
    "references",
]


# Docker location
VOCABULARY_PATH = "/app/skill_vocabulary.json"


# Words commonly used as category labels in resumes.
# These are NOT skills we want to return.
SKILL_CATEGORY_WORDS = {
    "programming",
    "backend",
    "frontend",
    "databases",
    "database",
    "cloud",
    "devops",
    "development",
    "tools",
    "technologies",
    "technology",
    "frameworks",
    "framework",
    "languages",
    "libraries",
    "library",
    "platforms",
    "platform",
    "web",
    "core concepts",
    "core concept",
}
# Skills that may be split across multiple PDF lines
MULTI_WORD_SKILLS = {
    "machine learning",
    "deep learning",
    "data science",
    "data analysis",
    "computer vision",
    "natural language processing",
    "rest api",
    "rest apis",
    "data structures",
    "operating systems",
    "object oriented programming",
    "object oriented design",
    "software engineering",
    "cloud computing",
}

# ============================================================
# TEXT NORMALIZATION
# ============================================================

def normalize_text(text):
    """
    Clean and repair common PDF extraction formatting issues.
    """

    if not text:
        return ""

    text = text.replace("\x00", " ")

    # Normalize line endings
    text = re.sub(r"\r\n?", "\n", text)

    # Fix common PDF character corruption
    #
    # Example:
    # T echnologies -> Technologies
    # T ools -> Tools
    #
    text = re.sub(
        r"\b([A-Za-z])\s+([a-z]{3,})\b",
        r"\1\2",
        text
    )

    # Normalize common PDF bullet characters
    text = text.replace("â€¢", "\n")
    text = text.replace("Â·", "\n")
    text = text.replace("â—", "\n")
    text = text.replace("â–ª", "\n")
    text = text.replace("â—¦", "\n")

    # Normalize spaces while preserving newlines
    text = re.sub(r"[ \t]+", " ", text)

    return text.strip()
# ============================================================
# FIND SKILLS SECTION
# ============================================================

def find_skills_section(text):
    """
    Find the dedicated Skills section in the resume.

    Returns:
        Skills section text or None.
    """

    text = normalize_text(text)

    if not text:
        return None

    headings = "|".join(
        re.escape(heading)
        for heading in sorted(
            SKILL_SECTION_HEADINGS,
            key=len,
            reverse=True
        )
    )

    next_sections = "|".join(
        re.escape(section)
        for section in sorted(
            NEXT_SECTIONS,
            key=len,
            reverse=True
        )
    )

    pattern = rf"""
        (?:^|\n)
        \s*(?:{headings})
        \s*:?\s*
        (.*?)
        (?=
            \n\s*(?:{next_sections})
            \s*:?\s*(?:\n|$)
            |
            \Z
        )
    """

    match = re.search(
        pattern,
        text,
        flags=(
            re.IGNORECASE
            | re.MULTILINE
            | re.DOTALL
            | re.VERBOSE
        ),
    )

    if not match:
        return None

    return match.group(1).strip()


# ============================================================
# LOAD VOCABULARY
# ============================================================

def load_vocabulary():
    """
    Load skill vocabulary generated from the job dataset.

    Current vocabulary format:

        {
            "python": {
                "name": "Python",
                "frequency": 5860
            }
        }
    """

    if not os.path.exists(VOCABULARY_PATH):
        print(
            f"WARNING: Vocabulary not found at "
            f"{VOCABULARY_PATH}"
        )

        return {}

    try:

        with open(
            VOCABULARY_PATH,
            "r",
            encoding="utf-8"
        ) as file:

            vocabulary = json.load(file)

        if not isinstance(vocabulary, dict):
            print("WARNING: Vocabulary is not a dictionary.")
            return {}

        return vocabulary

    except Exception as e:

        print(
            f"ERROR loading vocabulary: {e}"
        )

        return {}


# ============================================================
# NORMALIZE SKILL
# ============================================================

def normalize_skill(skill):
    """
    Normalize a skill for comparison.
    """

    if not skill:
        return ""

    skill = str(skill).lower().strip()

    # Normalize whitespace
    skill = re.sub(
        r"\s+",
        " ",
        skill
    )

    # Remove common surrounding punctuation
    skill = skill.strip(
        " .,:;|/-_"
    )

    return skill


# ============================================================
# CLEAN VOCABULARY
# ============================================================

def get_vocabulary_skills():
    """
    Convert vocabulary JSON into:

        [
            ("python", "Python", 5860),
            ("flask", "Flask", 2000),
            ...
        ]

    The frequency is retained because it can be useful when
    resolving duplicate/ambiguous vocabulary entries.

    Skills are sorted longest-first.
    """

    vocabulary = load_vocabulary()

    skills = []

    for key, value in vocabulary.items():

        normalized_key = normalize_skill(key)

        if not normalized_key:
            continue

        # Current vocabulary format
        if isinstance(value, dict):

            skill_name = value.get(
                "name",
                key
            )

            frequency = value.get(
                "frequency",
                0
            )

        # Support simple/old format
        else:

            skill_name = value
            frequency = 0

        if not skill_name:
            continue

        skill_name = str(skill_name).strip()

        if not skill_name:
            continue

        # Don't return category labels
        if normalize_skill(skill_name) in SKILL_CATEGORY_WORDS:
            continue

        try:
            frequency = int(frequency)
        except (TypeError, ValueError):
            frequency = 0

        skills.append(
            (
                normalized_key,
                skill_name,
                frequency
            )
        )

    # --------------------------------------------------------
    # Remove duplicate normalized keys.
    #
    # If duplicates exist, keep the highest-frequency entry.
    # --------------------------------------------------------

    unique = {}

    for normalized_key, skill_name, frequency in skills:

        if normalized_key not in unique:

            unique[normalized_key] = (
                skill_name,
                frequency
            )

        else:

            existing_name, existing_frequency = unique[
                normalized_key
            ]

            if frequency > existing_frequency:

                unique[normalized_key] = (
                    skill_name,
                    frequency
                )

    result = []

    for normalized_key, (
        skill_name,
        frequency
    ) in unique.items():

        result.append(
            (
                normalized_key,
                skill_name,
                frequency
            )
        )

    # Longest phrase first.
    #
    # If two skills have the same length, use frequency
    # as a secondary ordering criterion.
    result.sort(
        key=lambda item: (
            len(item[0]),
            item[2]
        ),
        reverse=True
    )

    return result


# ============================================================
# SPLIT SKILL TEXT
# ============================================================

def split_skill_text(skill_text):
    """
    Split the Skills section into actual skill phrases.
    """

    if not skill_text:
        return []

    text = normalize_text(skill_text)

    # Normalize separators
    text = re.sub(r"[|;/]+", ",", text)

    # Remove bullet characters
    text = re.sub(
        r"^\s*[-*•▪◦]+\s*",
        "",
        text,
        flags=re.MULTILINE
    )

    # --------------------------------------------------------
    # Remove skill category labels
    #
    # Examples:
    # Technologies:Machine Learning
    # Tools & Platforms: Git
    # Web: HTML
    # --------------------------------------------------------

  

  # Remove category labels before a colon.
#
# Example:
#   Programming: Python, Java
#   Machine Learning: Scikit-learn, TensorFlow
#   APIs & Services: REST API, FastAPI
#
# Anything before ":" at the beginning of a line
# is treated as a category label.

    # --------------------------------------------------------
    # Remove category labels before a colon
    #
    # Example:
    #   Programming: Python, Java
    #   Machine Learning: Scikit-learn, TensorFlow
    #   APIs & Services: REST API, FastAPI
    #
    # Anything before ":" at the beginning of a line
    # is treated as a category label.
    # --------------------------------------------------------

    text = re.sub(
        r"(?im)^[^:\n]+:\s*",
        "",
        text
    )
    

    # --------------------------------------------------------
    # Handle PDF line wrapping
    #
    # Transformer
    # Models (mBART)
    #
    # -> Transformer Models (mBART)
    # --------------------------------------------------------

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    merged_lines = []

    i = 0

    while i < len(lines):

        current = lines[i]
                # Reconstruct known skills split across PDF lines
        if i + 1 < len(lines):

            combined = current + " " + lines[i + 1]

            if normalize_skill(combined) in MULTI_WORD_SKILLS:
                current = combined
                i += 1

        if i + 1 < len(lines):

            next_line = lines[i + 1]

            # If the next line ends with ')' it is likely
            # a continuation of the current skill.
            if (
                not re.search(r"[,;:]$", current)
                and re.match(r"^[A-Za-z].*\)$", next_line)
            ):
                current = current + " " + next_line
                i += 1

        merged_lines.append(current)

        i += 1

    text = "\n".join(merged_lines)

    # Convert newlines into separators
    text = re.sub(r"\n+", ",", text)

    # Split comma-separated skills
    raw_items = text.split(",")

    skills = []

    for item in raw_items:

        item = item.strip()

        if not item:
            continue

        # Remove leading/trailing punctuation
        item = item.strip(" .,:;|/-_")

        if not item:
            continue

        skills.append(item)

    return skills


# ============================================================
# CHECK IF SKILL OCCURS IN TEXT
# ============================================================

def skill_occurs_in_text(text, skill):
    """
    Match a skill only as a complete word/phrase.

    This is intentionally NOT substring matching.

    Examples:

        Python
            -> matches Python

        Machine Learning
            -> matches Machine Learning

        r inside Transformer
            -> DOES NOT MATCH

        ER inside Systems
            -> DOES NOT MATCH

        tems inside Systems
            -> DOES NOT MATCH
    """

    if not text or not skill:
        return False

    text = str(text)
    skill = str(skill).strip()

    if not skill:
        return False

    escaped_skill = re.escape(skill)

    # --------------------------------------------------------
    # Whole-token / whole-phrase matching.
    #
    # The character immediately before and after the skill
    # cannot be a letter or number.
    #
    # This prevents:
    #
    #   r       -> matching Transformer
    #   ER      -> matching Systems
    #   tems    -> matching Systems
    #
    # --------------------------------------------------------

    pattern = (
        r"(?<![A-Za-z0-9])"
        + escaped_skill
        + r"(?![A-Za-z0-9])"
    )

    return re.search(
        pattern,
        text,
        flags=re.IGNORECASE
    ) is not None


# ============================================================
# REMOVE NESTED / PARTIAL SKILLS
# ============================================================

def remove_nested_skills(skills):
    """
    Remove smaller skills when they are completely contained
    inside a longer extracted skill.

    Example:

        Machine Learning
        Machine
        Learning

    becomes:

        Machine Learning

    This prevents the vocabulary from producing multiple
    overlapping skills when the resume explicitly contains
    a larger phrase.
    """

    if not skills:
        return []

    # Normalize while preserving original display names.
    normalized = []

    for skill in skills:

        norm = normalize_skill(skill)

        if not norm:
            continue

        normalized.append(
            (norm, skill)
        )

    # Longest first.
    normalized.sort(
        key=lambda item: len(item[0]),
        reverse=True
    )

    kept = []

    for current_norm, current_name in normalized:

        is_nested = False

        for kept_norm, kept_name in kept:

            # Exact duplicate
            if current_norm == kept_norm:
                is_nested = True
                break

            # Current skill is a complete phrase inside a
            # longer skill.
            #
            # Example:
            #
            # current = "machine"
            # kept    = "machine learning"
            #
            # We only remove it when it occurs as a complete
            # token/phrase.
            nested_pattern = (
                r"(?<![A-Za-z0-9])"
                + re.escape(current_norm)
                + r"(?![A-Za-z0-9])"
            )

            if re.search(
                nested_pattern,
                kept_norm,
                flags=re.IGNORECASE
            ):

                is_nested = True
                break

        if not is_nested:

            kept.append(
                (
                    current_norm,
                    current_name
                )
            )

    return [
        name
        for _, name in kept
    ]


# ============================================================
# MATCH INDIVIDUAL CANDIDATE PHRASES
# ============================================================

def match_candidate_phrase(
    candidate,
    vocabulary_skills
):
    """
    Match ONE resume candidate phrase against the vocabulary.

    Only exact normalized phrase matches are accepted.

    Example:

        candidate:
            "Machine Learning"

        vocabulary:
            "machine learning"

        result:
            "Machine Learning"

    We do NOT search for vocabulary words inside arbitrary
    pieces of the candidate.
    """

    normalized_candidate = normalize_skill(
        candidate
    )

    if not normalized_candidate:
        return None

    # --------------------------------------------------------
    # Direct exact match.
    # --------------------------------------------------------

    for normalized_key, skill_name, frequency in vocabulary_skills:

        if normalized_candidate == normalized_key:

            return skill_name

    # --------------------------------------------------------
    # Handle a small amount of PDF formatting noise:
    #
    # Example:
    #
    # Transformer Models (mBART)
    #
    # If the vocabulary contains:
    #
    # Transformer Models
    #
    # we can safely match the candidate's beginning only
    # when the remaining part is parenthesized metadata.
    # --------------------------------------------------------

    metadata_match = re.match(
        r"^(.*?)\s*\([^)]*\)$",
        normalized_candidate
    )

    if metadata_match:

        base_candidate = normalize_skill(
            metadata_match.group(1)
        )

        for normalized_key, skill_name, frequency in vocabulary_skills:

            if base_candidate == normalized_key:

                return skill_name

    return None


# ============================================================
# MATCH SKILLS AGAINST VOCABULARY
# ============================================================

def match_skills_with_vocabulary(
    raw_skills,
    full_section_text=None
):
    """
    Return the actual skill phrases found in the Skills section.

    Vocabulary matching is intentionally disabled.

    The extractor should return what the candidate actually
    wrote in the Skills section instead of filtering skills
    through skill_vocabulary.json.
    """

    if not raw_skills:
        return []

    # Remove duplicate skills while preserving the original
    # order and display formatting.
    unique_skills = []
    seen = set()

    for skill in raw_skills:

        skill = skill.strip()

        if not skill:
            continue

        normalized = normalize_skill(skill)

        if not normalized:
            continue

        if normalized in seen:
            continue

        seen.add(normalized)
        unique_skills.append(skill)

    # Remove smaller phrases that are completely contained
    # inside a longer skill.
    return remove_nested_skills(unique_skills)


# ============================================================
# MAIN EXTRACTION FUNCTION
# ============================================================

def extract_skills_from_section(text):
    """
    Extract skills from the dedicated Skills section.

    Process:

        Resume text
            ↓
        Find Skills section
            ↓
        Split into candidate phrases
            ↓
        Exact vocabulary matching
            ↓
        Remove nested/duplicate skills
            ↓
        Return clean skills
    """

    section = find_skills_section(
        text
    )

    if not section:

        print(
            "WARNING: Skills section not found."
        )

        return []

    raw_skills = split_skill_text(
        section
    )

    print(
        "\n[DEBUG] Skills section:"
    )

    print(
        section
    )

    print(
        "\n[DEBUG] Candidate phrases:"
    )

    for item in raw_skills:

        print(
            "-",
            item
        )

    extracted_skills = (
        match_skills_with_vocabulary(
            raw_skills,
            section
        )
    )

    return extracted_skills


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    sample_resume = """
    JOHN DOE

    SUMMARY
    Computer Science graduate.

    SKILLS

    Technologies:
    Python, Machine Learning, JavaScript, SQL

    Tools & Platforms:
    Flask, REST APIs, Git, Docker

    Databases:
    PostgreSQL, SQLite

    EXPERIENCE
    Software Developer

    Developed REST APIs using Python and Flask.

    PROJECTS
    Job recommendation platform.
    """

    print(
        "=" * 60
    )

    print(
        "SwipeX - Skill Extractor Test"
    )

    print(
        "=" * 60
    )

    skills = extract_skills_from_section(
        sample_resume
    )

    print(
        "\nExtracted Skills:"
    )

    for skill in skills:

        print(
            "-",
            skill
        )

    print(
        "\nTotal:",
        len(skills)
    )

