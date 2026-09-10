"""
AI/NLP based resume-job matching.

Uses:

- spaCy for NLP support
- Sentence Transformers for semantic similarity
- Lightweight lexical similarity
- Explicit skill vocabulary + aliases

Important rules:

- Arbitrary noun phrases are NOT treated as skills.
- Required skills are separated from preferred/general skills.
- Skill aliases are normalized before comparison.
- AI / Artificial Intelligence / AI/ML are treated as one
  canonical AI/ML concept.
- React / ReactJS / React.js are normalized.
- Node / NodeJS / Node.js are normalized.
- Python Programming is normalized to Python.
- REST / REST API / RESTful API are normalized.
- If zero required skills are recognized, Skill Match = 0.
- If zero required skills match, Skill Match = 0.
- No artificial score boosting.
"""

from __future__ import annotations

import math
import re
from typing import Any

import numpy as np
import spacy
from sentence_transformers import SentenceTransformer


# =========================================================
# MODEL LOADING
# =========================================================

try:
    NLP = spacy.load(
        "en_core_web_sm"
    )
except Exception:
    NLP = spacy.blank("en")


try:
    EMBEDDING_MODEL = SentenceTransformer(
        "all-MiniLM-L6-v2"
    )
except Exception as error:
    print(
        f"Sentence Transformer load warning: {error}"
    )
    EMBEDDING_MODEL = None


# =========================================================
# CACHES
# =========================================================

_EMBEDDING_CACHE: dict[
    str,
    np.ndarray,
] = {}

_JOB_SKILLS_CACHE: dict[
    int,
    list[str],
] = {}

_MAX_CACHE_SIZE = 4000


# =========================================================
# KNOWN SKILLS
# =========================================================

KNOWN_SKILLS = [
    # -----------------------------------------------------
    # Programming
    # -----------------------------------------------------
    "Python",
    "Java",
    "JavaScript",
    "TypeScript",
    "C",
    "C++",
    "C#",
    "Go",
    "Rust",
    "PHP",
    "Ruby",
    "Kotlin",
    "Swift",
    "Scala",
    "R",
    "MATLAB",
    "Dart",

    # -----------------------------------------------------
    # Web / Frontend
    # -----------------------------------------------------
    "HTML",
    "CSS",
    "React",
    "React.js",
    "React Native",
    "Angular",
    "Vue",
    "Vue.js",
    "Node.js",
    "Express.js",
    "Next.js",
    "Nuxt.js",
    "jQuery",
    "Bootstrap",
    "Tailwind CSS",
    "Material UI",
    "Ant Design",
    "Redux",
    "Webpack",
    "Vite",
    "UI",

    # -----------------------------------------------------
    # APIs
    # -----------------------------------------------------
    "REST",
    "REST API",
    "RESTful API",
    "GraphQL",

    # -----------------------------------------------------
    # Backend
    # -----------------------------------------------------
    "Django",
    "Flask",
    "FastAPI",
    "Spring",
    "Spring Boot",
    "ASP.NET",
    ".NET",
    "Laravel",
    "Hibernate",
    "JPA",
    "Maven",
    "Gradle",
    "J2EE",
    "JEE",
    "Microservices",

    # -----------------------------------------------------
    # Databases
    # -----------------------------------------------------
    "SQL",
    "MySQL",
    "PostgreSQL",
    "Oracle",
    "MongoDB",
    "Redis",
    "SQLite",
    "Microsoft SQL Server",
    "RDBMS",
    "NoSQL",
    "PL/SQL",

    # -----------------------------------------------------
    # AI / ML / Data
    # -----------------------------------------------------
    "Artificial Intelligence",
    "AI",
    "AI/ML",
    "Machine Learning",
    "Deep Learning",
    "Natural Language Processing",
    "NLP",
    "Computer Vision",
    "Generative AI",
    "LLM",
    "Large Language Models",
    "Scikit-learn",
    "TensorFlow",
    "PyTorch",
    "Keras",
    "Pandas",
    "NumPy",
    "Matplotlib",
    "Seaborn",
    "OpenCV",
    "Hugging Face",
    "LangChain",
    "Data Analysis",
    "Data Science",
    "Data Visualization",
    "PySpark",
    "Databricks",
    "Snowflake",
    "Airflow",
    "ETL",
    "Data Warehouse",
    "Data Warehousing",
    "Data Modeling",

    # -----------------------------------------------------
    # Cloud / DevOps
    # -----------------------------------------------------
    "AWS",
    "Amazon Web Services",
    "Azure",
    "Microsoft Azure",
    "Google Cloud",
    "GCP",
    "Docker",
    "Kubernetes",
    "Jenkins",
    "CI/CD",
    "Git",
    "GitHub",
    "GitLab",
    "Bitbucket",
    "Terraform",
    "Ansible",
    "Prometheus",
    "Grafana",
    "Splunk",

    # -----------------------------------------------------
    # Analytics
    # -----------------------------------------------------
    "Tableau",
    "Power BI",
    "Excel",
    "Advanced Excel",
    "Power Query",

    # -----------------------------------------------------
    # Testing
    # -----------------------------------------------------
    "Selenium",
    "Cypress",
    "Playwright",
    "Jest",
    "PyTest",
    "JUnit",
    "Unit Testing",
    "Integration Testing",
    "Automation Testing",
    "API Testing",

    # -----------------------------------------------------
    # Security
    # -----------------------------------------------------
    "Cybersecurity",
    "Information Security",
    "Network Security",
    "Penetration Testing",
    "OWASP",

    # -----------------------------------------------------
    # Project / Product
    # -----------------------------------------------------
    "Project Management",
    "Product Management",
    "Jira",
    "Confluence",
    "Agile",
    "Scrum",
    "Kanban",

    # -----------------------------------------------------
    # Design
    # -----------------------------------------------------
    "Figma",
    "UI/UX",
    "UX",
    "User Experience",
    "Wireframing",

    # -----------------------------------------------------
    # Business
    # -----------------------------------------------------
    "Sales",
    "Marketing",
    "Digital Marketing",
    "Content Marketing",
    "SEO",
    "SEM",
    "Social Media Marketing",
    "Business Development",
    "Customer Service",
    "Customer Support",
    "Communication",
    "Leadership",
    "Teamwork",
    "Negotiation",
    "Presentation",
    "Public Speaking",
    "Recruitment",
    "Talent Acquisition",
    "Human Resources",
    "HR",
    "Market Research",
    "Business Analysis",
    "Financial Analysis",
    "Accounting",
    "Bookkeeping",
    "Operations",
    "Supply Chain",
    "Event Management",
    "Content Writing",
    "Technical Writing",
    "Copywriting",
    "Risk Management",
    "Compliance",
]


# =========================================================
# SKILL ALIASES
# =========================================================

SKILL_ALIASES = {
    # Programming
    "javascript": "JavaScript",
    "java script": "JavaScript",
    "js": "JavaScript",

    "typescript": "TypeScript",
    "ts": "TypeScript",

    "python programming": "Python",
    "python development": "Python",

    # React
    "react": "React.js",
    "react js": "React.js",
    "reactjs": "React.js",

    # Node
    "node": "Node.js",
    "node js": "Node.js",
    "nodejs": "Node.js",

    # Express
    "express": "Express.js",
    "express js": "Express.js",
    "expressjs": "Express.js",

    # Mongo
    "mongodb": "MongoDB",
    "mongo db": "MongoDB",
    "mongo": "MongoDB",

    # PostgreSQL
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",

    # ML / AI
    "ai": "AI/ML",
    "ai ml": "AI/ML",
    "ai/ml": "AI/ML",
    "artificial intelligence": "AI/ML",

    "machine learning": "Machine Learning",
    "machine-learning": "Machine Learning",

    "deep learning": "Deep Learning",

    # NLP
    "natural language processing":
        "NLP",
    "nlp":
        "NLP",

    # Scikit-learn
    "scikit learn":
        "Scikit-learn",
    "scikit-learn":
        "Scikit-learn",
    "sklearn":
        "Scikit-learn",

    # Numerical libraries
    "numpy": "NumPy",
    "pandas": "Pandas",
    "matplotlib": "Matplotlib",

    # REST
    "rest": "REST API",
    "rest api": "REST API",
    "restful api": "REST API",
    "restful": "REST API",

    # HTML / CSS
    "html5": "HTML",
    "css3": "CSS",

    # Database
    "sql server":
        "Microsoft SQL Server",
    "mssql":
        "Microsoft SQL Server",

    # Cloud
    "aws":
        "AWS",
    "amazon web services":
        "AWS",

    "azure":
        "Azure",
    "microsoft azure":
        "Azure",

    "gcp":
        "GCP",
    "google cloud":
        "GCP",

    # Data modeling variants
    "data modelling":
        "Data Modeling",
    "data modeller":
        "Data Modeling",
    "data modeler":
        "Data Modeling",
}


# =========================================================
# TEXT HELPERS
# =========================================================

def clean_text(text: Any) -> str:
    """Normalize whitespace."""

    if text is None:
        return ""

    text = str(text)

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    return text.strip()


def normalize_phrase(value: str) -> str:
    """Normalize a phrase for comparison."""

    value = clean_text(value).lower()

    value = value.replace(
        "’",
        "'",
    )

    value = re.sub(
        r"[^a-z0-9+#./& -]",
        " ",
        value,
    )

    value = re.sub(
        r"\s+",
        " ",
        value,
    )

    return value.strip()


def canonical_skill(skill: str) -> str:
    """
    Convert a skill into a canonical representation.

    Matching uses this canonical value.
    """

    normalized = normalize_phrase(
        skill
    )

    if not normalized:
        return ""

    if normalized in SKILL_ALIASES:
        return normalize_phrase(
            SKILL_ALIASES[
                normalized
            ]
        )

    replacements = {
        "react":
            "react.js",

        "react js":
            "react.js",

        "reactjs":
            "react.js",

        "node":
            "node.js",

        "node js":
            "node.js",

        "nodejs":
            "node.js",

        "express":
            "express.js",

        "express js":
            "express.js",

        "expressjs":
            "express.js",

        "mongo db":
            "mongodb",

        "scikit learn":
            "scikit-learn",

        "sklearn":
            "scikit-learn",

        "restful api":
            "rest api",

        "rest":
            "rest api",

        "ai":
            "ai/ml",

        "artificial intelligence":
            "ai/ml",

        "ai ml":
            "ai/ml",

        "python programming":
            "python",

        "data modelling":
            "data modeling",

        "data modeler":
            "data modeling",

        "data modeller":
            "data modeling",
    }

    return replacements.get(
        normalized,
        normalized,
    )


def display_skill(skill: str) -> str:
    """Return a consistent display name."""

    canonical = canonical_skill(
        skill
    )

    display_names = {
        "python":
            "Python",

        "java":
            "Java",

        "javascript":
            "JavaScript",

        "typescript":
            "TypeScript",

        "react.js":
            "React.js",

        "react native":
            "React Native",

        "node.js":
            "Node.js",

        "express.js":
            "Express.js",

        "mongodb":
            "MongoDB",

        "postgresql":
            "PostgreSQL",

        "scikit-learn":
            "Scikit-learn",

        "numpy":
            "NumPy",

        "pandas":
            "Pandas",

        "matplotlib":
            "Matplotlib",

        "machine learning":
            "Machine Learning",

        "deep learning":
            "Deep Learning",

        "ai/ml":
            "AI/ML",

        "nlp":
            "NLP",

        "rest api":
            "REST API",

        "html":
            "HTML",

        "css":
            "CSS",

        "sql":
            "SQL",

        "aws":
            "AWS",

        "azure":
            "Azure",

        "gcp":
            "GCP",

        "llm":
            "LLM",

        "c++":
            "C++",

        "c#":
            "C#",

        "ui/ux":
            "UI/UX",

        "data modeling":
            "Data Modeling",

        "postgreSQL":
            "PostgreSQL",
    }

    return display_names.get(
        canonical,
        clean_text(skill),
    )


# =========================================================
# SKILL NORMALIZATION
# =========================================================

def normalize_skills(
    value: Any,
) -> list[str]:
    """
    Convert raw skill data into a clean,
    canonicalized and unique list.
    """

    if value is None:
        return []

    if isinstance(
        value,
        (list, tuple, set),
    ):
        values = list(value)

    else:
        text = clean_text(value)

        if not text:
            return []

        values = re.split(
            r"[,;|\n]+",
            text,
        )

    result = []
    seen = set()

    for item in values:

        item = clean_text(item)

        if not item:
            continue

        if item.lower() in {
            "nan",
            "none",
            "null",
            "n/a",
            "na",
            "undefined",
        }:
            continue

        item = re.sub(
            r"^[•\-–—*]+\s*",
            "",
            item,
        ).strip()

        if len(item) < 2:
            continue

        if len(item) > 80:
            continue

        canonical = canonical_skill(
            item
        )

        if not canonical:
            continue

        if canonical in seen:
            continue

        seen.add(canonical)

        result.append(
            display_skill(item)
        )

    return result


# =========================================================
# SKILL DETECTION
# =========================================================

def _contains_skill(
    text: str,
    skill: str,
) -> bool:
    """
    Detect a known skill as a real phrase.
    """

    normalized_text = normalize_phrase(
        text
    )

    normalized_skill = normalize_phrase(
        skill
    )

    if (
        not normalized_text
        or not normalized_skill
    ):
        return False

    aliases = {
        normalized_skill,
        normalized_skill.replace(
            ".",
            "",
        ),
        normalized_skill.replace(
            ".",
            " ",
        ),
        normalized_skill.replace(
            "-",
            " ",
        ),
    }

    for alias in aliases:

        if not alias:
            continue

        pattern = (
            r"(?<![a-z0-9])"
            + re.escape(alias)
            + r"(?![a-z0-9])"
        )

        if re.search(
            pattern,
            normalized_text,
        ):
            return True

    return False


# =========================================================
# REMOVE DUPLICATES
# =========================================================

def _remove_duplicate_overlapping_skills(
    skills: list[str],
) -> list[str]:
    """
    Canonicalize and remove overlapping concepts.
    """

    canonical_values = []
    seen = set()

    for skill in skills:

        canonical = canonical_skill(
            skill
        )

        if not canonical:
            continue

        if canonical in seen:
            continue

        seen.add(canonical)

        canonical_values.append(
            display_skill(skill)
        )

    return canonical_values


# =========================================================
# EXTRACT ALL RECOGNIZED JOB SKILLS
# =========================================================

def extract_skills_from_job(
    job_description: str,
    raw_skills: str | list[str] | None = None,
    job_id: int | None = None,
) -> list[str]:
    """
    Extract recognized skills from:

    1. Structured skills
    2. Known skills appearing in description

    Arbitrary noun phrases are never treated as skills.
    """

    if (
        job_id is not None
        and job_id in _JOB_SKILLS_CACHE
    ):
        return _JOB_SKILLS_CACHE[
            job_id
        ]

    description = clean_text(
        job_description
    )

    collected: list[str] = []

    # Structured skills
    if raw_skills:
        collected.extend(
            normalize_skills(
                raw_skills
            )
        )

    # Known skills in description
    if description:

        for skill in KNOWN_SKILLS:

            if _contains_skill(
                description,
                skill,
            ):
                collected.append(
                    display_skill(skill)
                )

    final_skills = (
        _remove_duplicate_overlapping_skills(
            collected
        )
    )

    final_skills = final_skills[:40]

    if job_id is not None:
        _JOB_SKILLS_CACHE[
            job_id
        ] = final_skills

    return final_skills


# =========================================================
# REQUIRED SKILL EXTRACTION
# =========================================================

def extract_required_skills_from_job_description(
    description: str,
) -> list[str]:
    """
    Extract skills specifically from likely
    required/must-have sections.

    This prevents every technology mentioned in a
    description from automatically becoming required.
    """

    description = clean_text(
        description
    )

    if not description:
        return []

    sections: list[str] = []

    section_patterns = [
        r"(?:required skills?|required technical skills?)\s*[:\-]\s*(.*?)(?="
        r"(?:preferred skills?|preferred qualifications?|responsibilities?|"
        r"qualifications?|experience required|education|about the role|$))",

        r"(?:must have|must-have|essential skills?|essential skills / knowledge)"
        r"\s*[:\-]\s*(.*?)(?="
        r"(?:preferred|responsibilities?|qualifications?|experience required|$))",

        r"(?:technical/functional skills|technical skills)"
        r"\s*[:\-]\s*(.*?)(?="
        r"(?:experience required|roles and responsibilities|responsibilities?|"
        r"preferred|qualifications?|$))",

        r"(?:key requirements?|key skills?)"
        r"\s*[:\-]\s*(.*?)(?="
        r"(?:preferred|responsibilities?|qualifications?|$))",
    ]

    for pattern in section_patterns:

        matches = re.findall(
            pattern,
            description,
            flags=re.IGNORECASE,
        )

        for match in matches:

            cleaned = clean_text(
                match
            )

            if cleaned:
                sections.append(
                    cleaned
                )

    if not sections:
        return []

    # Detect known skills only inside these required sections.
    collected: list[str] = []

    for section in sections:

        for skill in KNOWN_SKILLS:

            if _contains_skill(
                section,
                skill,
            ):
                collected.append(
                    display_skill(skill)
                )

    return (
        _remove_duplicate_overlapping_skills(
            collected
        )
    )


# =========================================================
# EMBEDDINGS
# =========================================================

def _trim_embedding_cache() -> None:
    """Prevent unlimited in-memory cache growth."""

    if len(
        _EMBEDDING_CACHE
    ) < _MAX_CACHE_SIZE:
        return

    remove_count = int(
        _MAX_CACHE_SIZE * 0.25
    )

    keys = list(
        _EMBEDDING_CACHE.keys()
    )[
        :remove_count
    ]

    for key in keys:
        _EMBEDDING_CACHE.pop(
            key,
            None,
        )


def get_embedding(
    text: str,
) -> np.ndarray | None:
    """
    Compute and cache a normalized embedding.
    """

    if EMBEDDING_MODEL is None:
        return None

    text = clean_text(
        text
    )

    if not text:
        return None

    text_key = text[:1000]

    if (
        text_key
        in _EMBEDDING_CACHE
    ):
        return _EMBEDDING_CACHE[
            text_key
        ]

    try:

        vector = EMBEDDING_MODEL.encode(
            text_key,
            normalize_embeddings=True,
        )

        _trim_embedding_cache()

        _EMBEDDING_CACHE[
            text_key
        ] = vector

        return vector

    except Exception as error:

        print(
            f"Embedding error: {error}"
        )

        return None


def get_batch_embeddings(
    texts: list[str],
    batch_size: int = 64,
) -> list[np.ndarray | None]:
    """
    Compute embeddings in batches.
    Cached text is reused.
    """

    if (
        EMBEDDING_MODEL is None
        or not texts
    ):
        return [
            None
        ] * len(texts)

    results: list[
        np.ndarray | None
    ] = [
        None
    ] * len(texts)

    uncached_indices = []
    uncached_texts = []

    for index, text in enumerate(
        texts
    ):

        cleaned = clean_text(
            text
        )[:1000]

        if not cleaned:
            continue

        if (
            cleaned
            in _EMBEDDING_CACHE
        ):
            results[index] = (
                _EMBEDDING_CACHE[
                    cleaned
                ]
            )

        else:
            uncached_indices.append(
                index
            )
            uncached_texts.append(
                cleaned
            )

    if not uncached_texts:
        return results

    try:

        encoded = EMBEDDING_MODEL.encode(
            uncached_texts,
            batch_size=batch_size,
            normalize_embeddings=True,
            show_progress_bar=False,
        )

        _trim_embedding_cache()

        for i, vector in enumerate(
            encoded
        ):

            original_index = (
                uncached_indices[i]
            )

            original_text = (
                uncached_texts[i]
            )

            results[
                original_index
            ] = vector

            _EMBEDDING_CACHE[
                original_text
            ] = vector

    except Exception as error:

        print(
            f"Batch embedding error: {error}"
        )

    return results


# =========================================================
# SEMANTIC SIMILARITY
# =========================================================

def semantic_similarity(
    text_a: str,
    text_b: str,
    vec_a: np.ndarray | None = None,
    vec_b: np.ndarray | None = None,
) -> float:
    """
    Sentence Transformer cosine similarity.

    Returns 0 to 1.
    """

    if vec_a is None:
        vec_a = get_embedding(
            text_a
        )

    if vec_b is None:
        vec_b = get_embedding(
            text_b
        )

    if (
        vec_a is None
        or vec_b is None
    ):
        return 0.0

    try:

        score = float(
            vec_a @ vec_b
        )

        return max(
            0.0,
            min(1.0, score),
        )

    except Exception:
        return 0.0


# =========================================================
# LEXICAL SIMILARITY
# =========================================================

def lexical_similarity(
    text_a: str,
    text_b: str,
) -> float:
    """
    Lightweight lexical cosine-style similarity
    using shared normalized words.

    Returns 0 to 1.

    Note:
    This is NOT true TF-IDF.
    """

    text_a = clean_text(
        text_a
    )

    text_b = clean_text(
        text_b
    )

    if (
        not text_a
        or not text_b
    ):
        return 0.0

    try:

        words_a = set(
            re.findall(
                r"\b[a-zA-Z0-9+#.]{2,}\b",
                text_a.lower(),
            )
        )

        words_b = set(
            re.findall(
                r"\b[a-zA-Z0-9+#.]{2,}\b",
                text_b.lower(),
            )
        )

        if (
            not words_a
            or not words_b
        ):
            return 0.0

        intersection = (
            words_a & words_b
        )

        score = (
            len(intersection)
            /
            math.sqrt(
                len(words_a)
                * len(words_b)
            )
        )

        return max(
            0.0,
            min(1.0, score),
        )

    except Exception:
        return 0.0


# Backward compatibility
tfidf_similarity = lexical_similarity


# =========================================================
# SKILL MATCHING
# =========================================================

def _skills_match(
    candidate_skill: str,
    job_skill: str,
) -> bool:
    """
    Exact/canonical/controlled-alias match.
    """

    candidate = canonical_skill(
        candidate_skill
    )

    job = canonical_skill(
        job_skill
    )

    if (
        not candidate
        or not job
    ):
        return False

    return candidate == job


def semantic_skill_match(
    candidate_skills: list[str],
    job_skills: list[str],
    threshold: float = 0.84,
) -> tuple[
    list[str],
    list[str],
]:
    """
    Match candidate skills against job skills.

    Returns:

        matched_skills
        missing_skills

    Exact/canonical matches are preferred.

    Semantic matching is only used for unmatched skills
    and requires a high similarity threshold.
    """

    candidate_skills = normalize_skills(
        candidate_skills
    )

    job_skills = (
        _remove_duplicate_overlapping_skills(
            normalize_skills(
                job_skills
            )
        )
    )

    if not job_skills:
        return [], []

    if not candidate_skills:
        return [], job_skills

    matched: list[str] = []

    used_candidate_indices: set[
        int
    ] = set()

    unmatched_job_skills: list[
        str
    ] = []

    # -----------------------------------------------------
    # 1. Exact/canonical matching
    # -----------------------------------------------------

    for job_skill in job_skills:

        found = False

        for index, candidate_skill in enumerate(
            candidate_skills
        ):

            if (
                index
                in used_candidate_indices
            ):
                continue

            if _skills_match(
                candidate_skill,
                job_skill,
            ):

                matched.append(
                    display_skill(
                        job_skill
                    )
                )

                used_candidate_indices.add(
                    index
                )

                found = True
                break

        if not found:
            unmatched_job_skills.append(
                job_skill
            )

    # -----------------------------------------------------
    # 2. Semantic matching
    # -----------------------------------------------------

    if (
        unmatched_job_skills
        and EMBEDDING_MODEL is not None
    ):

        available_candidates = []

        for index, skill in enumerate(
            candidate_skills
        ):

            if (
                index
                in used_candidate_indices
            ):
                continue

            vector = get_embedding(
                skill
            )

            if vector is not None:
                available_candidates.append(
                    (
                        index,
                        vector,
                    )
                )

        for job_skill in unmatched_job_skills:

            job_vector = get_embedding(
                job_skill
            )

            if job_vector is None:
                continue

            best_index = None
            best_score = threshold

            for (
                candidate_index,
                candidate_vector,
            ) in available_candidates:

                if (
                    candidate_index
                    in used_candidate_indices
                ):
                    continue

                similarity = float(
                    candidate_vector
                    @
                    job_vector
                )

                if similarity >= best_score:

                    best_score = similarity

                    best_index = (
                        candidate_index
                    )

            if best_index is not None:

                matched.append(
                    display_skill(
                        job_skill
                    )
                )

                used_candidate_indices.add(
                    best_index
                )

    # -----------------------------------------------------
    # 3. Missing skills
    # -----------------------------------------------------

    matched_canonical = {
        canonical_skill(skill)
        for skill in matched
    }

    missing = []

    for job_skill in job_skills:

        if (
            canonical_skill(job_skill)
            not in matched_canonical
        ):

            missing.append(
                display_skill(
                    job_skill
                )
            )

    # -----------------------------------------------------
    # 4. Final cleanup
    # -----------------------------------------------------

    matched = list(
        dict.fromkeys(
            matched
        )
    )

    missing = list(
        dict.fromkeys(
            missing
        )
    )

    return (
        matched,
        missing,
    )


# =========================================================
# EXPERIENCE PARSING
# =========================================================

def parse_year_range(
    text: Any,
) -> tuple[
    float | None,
    float | None,
]:
    """
    Extract minimum and maximum years.

    Examples:

        8-10 years -> (8, 10)
        2 to 5 years -> (2, 5)
        5+ years -> (5, None)
        2 years -> (2, 2)
        entry level -> (0, 2)
    """

    text = clean_text(
        text
    ).lower()

    if not text:
        return None, None

    # Entry-level / fresher
    if any(
        phrase in text
        for phrase in [
            "fresher",
            "fresh graduate",
            "recent graduate",
            "entry level",
            "entry-level",
        ]
    ):
        return 0.0, 2.0

    # X+ years
    plus_match = re.search(
        r"(\d+(?:\.\d+)?)\s*\+\s*(?:years?|yrs?)",
        text,
    )

    if plus_match:

        minimum = float(
            plus_match.group(1)
        )

        return minimum, None

    # Range
    range_match = re.search(
        r"(\d+(?:\.\d+)?)\s*"
        r"(?:-|–|—|to)\s*"
        r"(\d+(?:\.\d+)?)\s*"
        r"(?:years?|yrs?)?",
        text,
    )

    if range_match:

        minimum = float(
            range_match.group(1)
        )

        maximum = float(
            range_match.group(2)
        )

        return (
            minimum,
            maximum,
        )

    # Single number
    single_match = re.search(
        r"(\d+(?:\.\d+)?)\s*"
        r"(?:years?|yrs?)",
        text,
    )

    if single_match:

        years = float(
            single_match.group(1)
        )

        return years, years

    return None, None


def extract_candidate_experience_years(
    candidate,
) -> float | None:
    """
    Estimate candidate experience using
    profile + resume information.
    """

    if candidate is None:
        return None

    values = []

    if isinstance(
        candidate,
        dict,
    ):

        values.extend(
            [
                candidate.get(
                    "experience",
                    "",
                ),
                candidate.get(
                    "text",
                    "",
                ),
            ]
        )

    else:

        values.append(
            getattr(
                candidate,
                "experience",
                "",
            )
        )

        resume = getattr(
            candidate,
            "resume",
            None,
        )

        if resume:

            values.append(
                getattr(
                    resume,
                    "extracted_text",
                    "",
                )
            )

            values.append(
                getattr(
                    resume,
                    "extracted_experience",
                    "",
                )
            )

    combined = " ".join(
        clean_text(value)
        for value in values
        if value
    )

    if not combined:
        return None

    combined_lower = combined.lower()

    # Explicit "X years"
    matches = re.findall(
        r"(\d+(?:\.\d+)?)\s*"
        r"\+?\s*(?:years?|yrs?)",
        combined_lower,
    )

    values_years = []

    for value in matches:

        years = float(value)

        if 0 <= years <= 50:
            values_years.append(
                years
            )

    if values_years:
        return max(
            values_years
        )

    # Fresher/student fallback
    student_indicators = [
        "student",
        "intern",
        "fresher",
        "recent graduate",
        "graduate",
        "b.tech",
        "btech",
        "undergraduate",
    ]

    if any(
        indicator
        in combined_lower
        for indicator
        in student_indicators
    ):
        return 0.0

    return None


def calculate_experience_fit(
    candidate,
    job,
) -> float:
    """
    Calculate experience compatibility from 0 to 100.
    """

    if job is None:
        return 50.0

    job_experience = clean_text(
        getattr(
            job,
            "experience",
            "",
        )
    )

    if not job_experience:
        return 50.0

    job_min, job_max = (
        parse_year_range(
            job_experience
        )
    )

    candidate_years = (
        extract_candidate_experience_years(
            candidate
        )
    )

    if (
        job_min is None
        and job_max is None
    ):
        return 50.0

    if candidate_years is None:
        return 50.0

    # Open-ended requirement
    if (
        job_min is not None
        and job_max is None
    ):

        if candidate_years >= job_min:
            return 100.0

        gap = (
            job_min
            - candidate_years
        )

        if gap <= 1:
            return 80.0

        if gap <= 2:
            return 60.0

        if gap <= 4:
            return 35.0

        return 10.0

    # Normal range
    if (
        job_min is not None
        and job_max is not None
    ):

        # Inside range
        if (
            job_min
            <= candidate_years
            <= job_max
        ):
            return 100.0

        # Below range
        if candidate_years < job_min:

            gap = (
                job_min
                - candidate_years
            )

            if gap <= 1:
                return 85.0

            if gap <= 2:
                return 65.0

            if gap <= 4:
                return 40.0

            return 15.0

        # Above range
        gap = (
            candidate_years
            - job_max
        )

        if gap <= 1:
            return 90.0

        if gap <= 3:
            return 75.0

        return 60.0

    return 50.0


# =========================================================
# COMPLETE JOB MATCH
# =========================================================

def calculate_job_match(
    resume_text: str,
    job_description: str,
    resume_skills: list[str] | None = None,
    job_skills: list[str] | None = None,
    required_job_skills: list[str] | None = None,
    candidate_embedding: np.ndarray | None = None,
    job_embedding: np.ndarray | None = None,
    candidate: Any = None,
    job: Any = None,
) -> dict[str, Any]:
    """
    Calculate job-specific ATS.

    ATS:

        45% Required Skill Coverage
        30% Semantic Resume ↔ Job Fit
        20% Experience Compatibility
         5% Lexical Relevance

    Skill Match:

        matched required skills
        ----------------------- × 100
        recognized required skills
    """

    resume_text = clean_text(
        resume_text
    )

    job_description = clean_text(
        job_description
    )

    # =====================================================
    # 1. CANDIDATE SKILLS
    # =====================================================

    candidate_skills = normalize_skills(
        resume_skills or []
    )

    # =====================================================
    # 2. ALL JOB SKILLS
    # =====================================================

    all_job_skills = (
        _remove_duplicate_overlapping_skills(
            normalize_skills(
                job_skills or []
            )
        )
    )

    # =====================================================
    # 3. REQUIRED JOB SKILLS
    # =====================================================

    required_skills = (
        _remove_duplicate_overlapping_skills(
            normalize_skills(
                required_job_skills or []
            )
        )
    )

    # Fallback to all recognized job skills
    if not required_skills:
        required_skills = list(
            all_job_skills
        )

    # Final description fallback
    if (
        not required_skills
        and job_description
    ):

        required_skills = (
            _remove_duplicate_overlapping_skills(
                extract_skills_from_job(
                    job_description
                )
            )
        )

    # =====================================================
    # 4. BUILD FOCUSED JOB TEXT
    # =====================================================

    job_core_parts = []

    if job is not None:

        title = clean_text(
            getattr(
                job,
                "title",
                "",
            )
        )

        experience = clean_text(
            getattr(
                job,
                "experience",
                "",
            )
        )

        required_text = clean_text(
            getattr(
                job,
                "required_skills",
                "",
            )
        )

        preferred_text = clean_text(
            getattr(
                job,
                "preferred_skills",
                "",
            )
        )

        if title:
            job_core_parts.append(
                title
            )

        if experience:
            job_core_parts.append(
                f"Experience: {experience}"
            )

        if required_text:
            job_core_parts.append(
                f"Required Skills: {required_text}"
            )

        if preferred_text:
            job_core_parts.append(
                f"Preferred Skills: {preferred_text}"
            )

    if job_description:
        job_core_parts.append(
            job_description[:2500]
        )

    job_core_text = clean_text(
        " ".join(
            job_core_parts
        )
    )

    if not job_core_text:
        job_core_text = job_description

    # =====================================================
    # 5. SEMANTIC FIT
    # =====================================================

    if (
        candidate_embedding is not None
    ):

        # If the supplied job embedding exists, use it.
        # Otherwise calculate the focused job embedding.
        if job_embedding is not None:

            raw_semantic_score = float(
                candidate_embedding
                @
                job_embedding
            )

        else:

            job_core_embedding = (
                get_embedding(
                    job_core_text
                )
            )

            if job_core_embedding is not None:

                raw_semantic_score = float(
                    candidate_embedding
                    @
                    job_core_embedding
                )

            else:

                raw_semantic_score = (
                    semantic_similarity(
                        resume_text,
                        job_core_text,
                    )
                )

    elif job_embedding is not None:

        resume_embedding = (
            get_embedding(
                resume_text
            )
        )

        if resume_embedding is not None:

            raw_semantic_score = float(
                resume_embedding
                @
                job_embedding
            )

        else:

            raw_semantic_score = (
                semantic_similarity(
                    resume_text,
                    job_core_text,
                )
            )

    else:

        raw_semantic_score = (
            semantic_similarity(
                resume_text,
                job_core_text,
            )
        )

    raw_semantic_score = max(
        0.0,
        min(
            1.0,
            raw_semantic_score,
        ),
    )

    # =====================================================
    # 6. SEMANTIC CALIBRATION
    # =====================================================

    semantic_score_percentage = (
        (
            raw_semantic_score
            - 0.25
        )
        / 0.50
    ) * 100.0

    semantic_score_percentage = max(
        0.0,
        min(
            100.0,
            semantic_score_percentage,
        ),
    )

    semantic_score = (
        semantic_score_percentage
        / 100.0
    )

    # =====================================================
    # 7. LEXICAL FIT
    # =====================================================

    lexical_score = lexical_similarity(
        resume_text,
        job_core_text,
    )

    lexical_score = max(
        0.0,
        min(
            1.0,
            lexical_score,
        ),
    )

    # =====================================================
    # 8. REQUIRED SKILL MATCHING
    # =====================================================

    matched_skills, missing_skills = (
        semantic_skill_match(
            candidate_skills=candidate_skills,
            job_skills=required_skills,
        )
    )

    # =====================================================
    # 9. SKILL MATCH %
    # =====================================================

    recognized_required_skill_count = (
        len(required_skills)
    )

    matched_required_skill_count = (
        len(matched_skills)
    )

    if (
        recognized_required_skill_count > 0
        and matched_required_skill_count > 0
    ):

        skill_match_percentage = round(
            (
                matched_required_skill_count
                /
                recognized_required_skill_count
            )
            * 100
        )

    else:

        skill_match_percentage = 0

    skill_score = (
        skill_match_percentage
        / 100.0
    )

    # =====================================================
    # 10. EXPERIENCE FIT
    # =====================================================

    experience_fit = (
        calculate_experience_fit(
            candidate,
            job,
        )
    )

    experience_score = (
        experience_fit
        / 100.0
    )

    # =====================================================
    # 11. FINAL ATS
    # =====================================================

    if (
        not resume_text
        and not candidate_skills
    ):

        ats_score = 0

    else:

        ats_score = round(
            skill_score * 45
            + semantic_score * 30
            + experience_score * 20
            + lexical_score * 5
        )

    ats_score = max(
        0,
        min(
            100,
            ats_score,
        ),
    )

    # =====================================================
    # 12. RETURN
    # =====================================================

    return {
        "ats_score":
            ats_score,

        "skill_match_percentage":
            skill_match_percentage,

        "matched_skills":
            matched_skills,

        "missing_skills":
            missing_skills,

        "recognized_job_skill_count":
            recognized_required_skill_count,

        "matched_job_skill_count":
            matched_required_skill_count,

        "semantic_similarity":
            round(
                semantic_score_percentage,
                2,
            ),

        "text_similarity":
            round(
                lexical_score * 100,
                2,
            ),

        "experience_fit":
            round(
                experience_fit,
                2,
            ),

        "why_matches": [],

        "tips": [],
    }