import re

from pypdf import PdfReader
from docx import Document
from dotenv import load_dotenv
from .skill_utils import COMMON_SKILLS, SKILL_ALIASES, categorize_skills, normalize_skill, normalize_skills

load_dotenv()

_GROQ_SKILL_EXTRACTION_DISABLED = False

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

SKILL_MATCH_TERMS = sorted(
    set(COMMON_SKILLS) | set(SKILL_ALIASES),
    key=lambda skill: (-len(skill), skill.lower())
)


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
    """Extract skills from unstructured text with Groq when configured."""
    if not text:
        return set()

    import json
    import os

    global _GROQ_SKILL_EXTRACTION_DISABLED

    if _GROQ_SKILL_EXTRACTION_DISABLED:
        return set()

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return set()

    try:
        from groq import Groq

        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "openai/gpt-oss-20b"),
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
        error_text = str(error)
        if (
            "rate_limit_exceeded" in error_text
            or "insufficient_quota" in error_text
            or "credit_balance_exhausted" in error_text
        ):
            _GROQ_SKILL_EXTRACTION_DISABLED = True
            print(
                "[resume_parser] Groq rate limit reached — disabling optional "
                "LLM skill extraction for this process."
            )
            return set()

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
