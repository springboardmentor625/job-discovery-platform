import re

from pypdf import PdfReader
from docx import Document

# ==========================================
# ALL RESUME PARSING LOGIC LIVES HERE.
# Previously split between this file (dead —
# nothing imported it) and resume_routes.py
# (the live copy). Consolidated so there's one
# place to look for parsing behavior.
# ==========================================


# ==========================================
# SKILL VOCABULARY
# Expanded well beyond the original 18-word
# list. Used as the PhraseMatcher vocabulary
# when spaCy is available, and as the regex
# fallback vocabulary when it isn't.
# ==========================================

COMMON_SKILLS = [
    # Programming Languages
    "python", "java", "javascript", "typescript", "c", "c++", "c#",
    "go", "rust", "php", "kotlin", "swift", "ruby", "scala", "r",
    "matlab", "perl", "dart",

    # Frontend
    "react", "angular", "vue", "html", "css", "tailwind", "bootstrap",
    "sass", "next.js", "redux", "jquery", "webpack",

    # Backend
    "node.js", "node", "express", "fastapi", "django", "flask",
    "spring boot", "spring", "laravel", "ruby on rails", "asp.net",
    "graphql", "rest api", "rest", "api", "microservices",

    # Databases
    "mysql", "postgresql", "mongodb", "redis", "sql", "sqlite",
    "oracle", "cassandra", "dynamodb", "elasticsearch", "firebase",

    # Cloud / DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "git", "github",
    "gitlab", "jenkins", "ci/cd", "terraform", "ansible", "linux",
    "nginx", "bash", "shell scripting",

    # Data / ML / AI
    "machine learning", "deep learning", "artificial intelligence",
    "data science", "data analysis", "data engineering", "pandas",
    "numpy", "scikit-learn", "tensorflow", "pytorch", "keras", "nlp",
    "computer vision", "opencv", "spacy", "sentence-transformers",
    "power bi", "tableau", "excel",

    # Mobile
    "android", "ios", "react native", "flutter", "swiftui",

    # Testing / QA
    "selenium", "pytest", "jest", "junit", "cypress", "postman",

    # Design / Product
    "figma", "sketch", "adobe xd", "ui/ux", "photoshop", "illustrator",

    # Project / Collaboration
    "jira", "confluence", "agile", "scrum", "kanban",

    # Marketing / Business (non-tech roles in this dataset)
    "seo", "digital marketing", "content writing", "market research",
    "negotiation", "salesforce", "google analytics", "social media",
    "video editing", "email marketing"
]


SKILL_ALIASES = {
    'angular.js': 'angular',
    'angularjs': 'angular',
    'artificial intelligence': 'artificial intelligence',
    'c sharp': 'c#',
    'ci cd': 'ci/cd',
    'ci-cd': 'ci/cd',
    'cpp': 'c++',
    'express.js': 'express',
    'fast api': 'fastapi',
    'fast-api': 'fastapi',
    'golang': 'go',
    'js': 'javascript',
    'k8s': 'kubernetes',
    'ml': 'machine learning',
    'mongo': 'mongodb',
    'mongo db': 'mongodb',
    'mysql db': 'mysql',
    'natural language processing': 'nlp',
    'nextjs': 'next.js',
    'node': 'node.js',
    'node.js': 'node.js',
    'nodejs': 'node.js',
    'opencv-python': 'opencv',
    'postgres': 'postgresql',
    'postgres db': 'postgresql',
    'postgres dbms': 'postgresql',
    'powerbi': 'power bi',
    'py': 'python',
    'pytorch': 'pytorch',
    'react.js': 'react',
    'reactjs': 'react',
    'restful': 'rest api',
    'restful api': 'rest api',
    'scikit learn': 'scikit-learn',
    'sklearn': 'scikit-learn',
    'tableau': 'tableau',
    'tailwindcss': 'tailwind',
    'tf': 'tensorflow',
    'ts': 'typescript',
    'ui ux': 'ui/ux',
    'ui/ux design': 'ui/ux',
    'vue.js': 'vue',
    'vuejs': 'vue',
}


def normalize_skill(raw_skill: str) -> str:
    cleaned = raw_skill.strip().lower()
    return SKILL_ALIASES.get(cleaned, cleaned)


SKILL_MATCH_TERMS = sorted(
    set(COMMON_SKILLS) | set(SKILL_ALIASES),
    key=lambda skill: (-len(skill), skill.lower())
)

SKILL_CATEGORIES = {
    "programming": {
        "python", "java", "javascript", "typescript", "c", "c++", "c#",
        "go", "rust", "php", "kotlin", "swift", "ruby", "scala", "r",
        "matlab", "perl", "dart"
    },
    "frontend": {
        "react", "angular", "vue", "html", "css", "tailwind", "bootstrap",
        "sass", "next.js", "redux", "jquery", "webpack"
    },
    "backend": {
        "node.js", "express", "fastapi", "django", "flask", "spring boot",
        "spring", "laravel", "ruby on rails", "asp.net", "graphql", "rest api",
        "rest", "api", "microservices"
    },
    "database": {
        "mysql", "postgresql", "mongodb", "redis", "sql", "sqlite", "oracle",
        "cassandra", "dynamodb", "elasticsearch", "firebase"
    },
    "cloud_devops": {
        "aws", "azure", "gcp", "docker", "kubernetes", "git", "github",
        "gitlab", "jenkins", "ci/cd", "terraform", "ansible", "linux", "nginx",
        "bash", "shell scripting"
    },
    "data_ai": {
        "machine learning", "deep learning", "artificial intelligence",
        "data science", "data analysis", "data engineering", "pandas", "numpy",
        "scikit-learn", "tensorflow", "pytorch", "keras", "nlp", "computer vision",
        "opencv", "spacy", "sentence-transformers", "power bi", "tableau", "excel"
    },
    "mobile": {
        "android", "ios", "react native", "flutter", "swiftui"
    },
    "testing": {
        "selenium", "pytest", "jest", "junit", "cypress", "postman"
    },
    "design": {
        "figma", "sketch", "adobe xd", "ui/ux", "photoshop", "illustrator"
    },
    "business": {
        "jira", "confluence", "agile", "scrum", "kanban", "seo",
        "digital marketing", "content writing", "market research", "negotiation",
        "salesforce", "google analytics", "social media", "video editing",
        "email marketing"
    },
}


def categorize_skills(raw_skills):
    skills = (
        {normalize_skill(skill) for skill in raw_skills.split(",") if skill.strip()}
        if isinstance(raw_skills, str)
        else {normalize_skill(skill) for skill in raw_skills if skill}
    )
    categories = set()
    for category, vocabulary in SKILL_CATEGORIES.items():
        if skills & vocabulary:
            categories.add(category)
    return categories



# ==========================================
# spaCy PHRASE MATCHER (with graceful fallback)
# ==========================================

SPACY_AVAILABLE = False
_nlp = None
_phrase_matcher = None

try:
    import spacy
    from spacy.matcher import PhraseMatcher

    _nlp = spacy.load("en_core_web_sm")
    _phrase_matcher = PhraseMatcher(_nlp.vocab, attr="LOWER")
    _phrase_matcher.add(
        "SKILLS",
        [_nlp.make_doc(skill) for skill in SKILL_MATCH_TERMS]
    )

    SPACY_AVAILABLE = True

except Exception as import_error:  # noqa: BLE001

    print(
        "[resume_parser] spaCy unavailable "
        f"({import_error}) — falling back to regex "
        "substring skill matching. Run "
        "`python -m spacy download en_core_web_sm` "
        "to enable NER-based extraction."
    )


# ==========================================
# EXTRACT PDF TEXT
# ==========================================

def extract_pdf_text(file_path):

    reader = PdfReader(file_path)

    text = ""

    for page in reader.pages:

        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return text


# Backward-compatible alias (older callers used this name)
extract_resume_text = extract_pdf_text


# ==========================================
# EXTRACT DOCX TEXT
# ==========================================

def extract_docx_text(file_path):

    document = Document(file_path)

    text = ""

    for paragraph in document.paragraphs:
        text += paragraph.text + "\n"

    return text


# ==========================================
# CLEAN RESUME TEXT
# ==========================================

def clean_resume_text(text):

    if not text:
        return ""

    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


# ==========================================
# EXTRACT SKILLS
#
# Uses spaCy's PhraseMatcher (NER-adjacent
# phrase matching over the full COMMON_SKILLS
# vocabulary) when available. Falls back to
# word-boundary regex substring matching over
# the same vocabulary when spaCy/its model
# isn't installed — same vocabulary either way,
# so results are consistent, just found via a
# more precise matcher when possible.
# ==========================================

def extract_skills(text):

    if not text:
        return ""

    detected = set()

    if SPACY_AVAILABLE:
        doc = _nlp(text)
        matches = _phrase_matcher(doc)
        detected.update(
            doc[start:end].text
            for _, start, end in matches
        )
    else:
        text_lower = text.lower()
        for skill in SKILL_MATCH_TERMS:
            pattern = r"(?<!\w)" + re.escape(skill.lower()) + r"(?!\w)"
            if re.search(pattern, text_lower):
                detected.add(skill)

    detected.update(extract_skills_with_llm(text))

    normalized = sorted(
        {normalize_skill(skill) for skill in detected if skill.strip()},
        key=str.lower
    )
    return ", ".join(normalized)


def extract_skills_with_llm(text):
    """Extract skills from unstructured text with OpenAI when configured."""
    if not text:
        return set()

    import json
    import os

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return set()

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Extract only explicit professional/technical skills from the text. "
                        "Return JSON with a single key skills whose value is an array of strings. "
                        "Do not infer skills that are not supported by the text."
                    ),
                },
                {"role": "user", "content": text[:12000]},
            ],
            max_tokens=300,
        )
        payload = json.loads(response.choices[0].message.content or "{}")
        return {
            normalize_skill(skill)
            for skill in payload.get("skills", [])
            if isinstance(skill, str) and skill.strip()
        }
    except Exception as error:  # noqa: BLE001
        print(f"[resume_parser] LLM skill extraction skipped: {error}")
        return set()


# ==========================================
# EXTRACT SECTION
# ==========================================

def extract_section(text, section_names):

    if not text:
        return ""

    heading_pattern = "|".join(
        re.escape(name)
        for name in section_names
    )

    pattern = re.compile(
        rf"(?:^|\n)\s*"
        rf"(?:{heading_pattern})"
        rf"\s*:?\s*\n"
        rf"(.*?)(?=\n\s*[A-Z][A-Za-z &/-]{{2,40}}\s*:?\s*\n|\Z)",
        re.IGNORECASE | re.DOTALL
    )

    match = pattern.search(text)

    if not match:
        return ""

    return match.group(1).strip()[:2000]


# ==========================================
# EXTRACT EXPERIENCE
# ==========================================

def extract_experience(text):

    experience_section = extract_section(
        text,
        [
            "experience",
            "work experience",
            "professional experience",
            "employment history",
            "work history"
        ]
    )

    if experience_section:
        return experience_section

    lines = text.splitlines()
    experience_lines = []

    for line in lines:

        line_lower = line.lower()

        if any(
            keyword in line_lower
            for keyword in [
                "years of experience",
                "year experience",
                "internship",
                "intern",
                "developer",
                "engineer",
                "software engineer"
            ]
        ):
            experience_lines.append(line.strip())

    return " ".join(experience_lines)[:2000]


# ==========================================
# EXTRACT EDUCATION
# ==========================================

def extract_education(text):

    education_section = extract_section(
        text,
        [
            "education",
            "academic background",
            "educational qualification",
            "academic qualifications"
        ]
    )

    if education_section:
        return education_section

    lines = text.splitlines()

    education_keywords = [
        "b.e", "b.tech", "be ", "btech", "m.e", "m.tech", "me ",
        "mtech", "b.sc", "bca", "mca", "mba", "phd", "bachelor",
        "master", "university", "college", "degree"
    ]

    education_lines = []

    for line in lines:

        line_lower = line.lower()

        if any(keyword in line_lower for keyword in education_keywords):
            education_lines.append(line.strip())

    return " ".join(education_lines)[:2000]


# ==========================================
# PARSE RESUME
# ==========================================

def parse_resume(text):

    cleaned_text = clean_resume_text(text)

    return {
        "extracted_text": cleaned_text,
        "extracted_skills": extract_skills(cleaned_text),
        "extracted_experience": extract_experience(cleaned_text),
        "extracted_education": extract_education(cleaned_text),
    }
