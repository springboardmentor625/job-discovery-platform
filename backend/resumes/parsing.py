"""
AI Resume Parsing (Candidate Workflow steps: 'AI Resume Parsing' + 'Extract
Skills & Experience').

This is a keyword-matching implementation so the workflow runs end-to-end
without requiring an OpenAI API key. It is intentionally structured so the
`extract_text` and `extract_skills` functions can each be swapped later for
a real NLP/OpenAI pipeline (per the project's tech stack: OpenAI API, spaCy,
sentence-transformers) without touching any of the calling code in views.py.
"""
import io
import re

import pdfplumber
from docx import Document

# A starter skill vocabulary. Extend this list as needed — it drives both
# resume skill extraction and job/resume ATS matching.
SKILL_KEYWORDS = [
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
    "react", "react.js", "vue", "angular", "node.js", "express", "django",
    "django rest framework", "fastapi", "flask", "spring boot",
    "html", "css", "tailwind css", "redux", "next.js",
    "sql", "postgresql", "mysql", "mongodb", "redis", "sqlite",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform",
    "git", "github", "github actions", "ci/cd", "jenkins",
    "machine learning", "deep learning", "nlp", "computer vision",
    "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
    "data analysis", "data visualization", "power bi", "tableau", "excel",
    "rest api", "graphql", "microservices", "system design",
    "agile", "scrum", "project management", "jira",
    "communication", "leadership", "problem solving", "teamwork",
]


def extract_text(file_obj, filename: str) -> str:
    """Extract raw text from an uploaded PDF, DOCX, or plain-text file."""
    name = filename.lower()

    if name.endswith(".pdf"):
        text_parts = []
        with pdfplumber.open(file_obj) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text_parts.append(page_text)
        return "\n".join(text_parts)

    if name.endswith(".docx"):
        document = Document(file_obj)
        return "\n".join(p.text for p in document.paragraphs)

    # Fallback: treat as plain text
    raw = file_obj.read()
    if isinstance(raw, bytes):
        return raw.decode("utf-8", errors="ignore")
    return str(raw)


def extract_skills(text: str) -> list[str]:
    """Match SKILL_KEYWORDS against the resume text (case-insensitive, whole-word/phrase)."""
    text_lower = text.lower()
    found = []
    for skill in SKILL_KEYWORDS:
        pattern = r"(?<!\w)" + re.escape(skill) + r"(?!\w)"
        if re.search(pattern, text_lower):
            found.append(skill)
    return found


def parse_resume(file_obj, filename: str) -> dict:
    """Run the full parse: extract text, then extract skills from it."""
    text = extract_text(file_obj, filename)
    skills = extract_skills(text)
    return {"parsed_text": text, "extracted_skills": skills}