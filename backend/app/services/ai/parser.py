import io
import re
from typing import Any, Dict, List

import pdfplumber

# Read-only language model handle. Never stores resume/profile text.
_SPACY_NLP = None


def _get_nlp():
    global _SPACY_NLP
    if _SPACY_NLP is False:
        return None
    if _SPACY_NLP is None:
        try:
            import spacy
            _SPACY_NLP = spacy.load("en_core_web_sm")
        except Exception:
            _SPACY_NLP = False
            return None
    return _SPACY_NLP if _SPACY_NLP is not False else None


_TECH_SKILLS = (
    "python", "java", "javascript", "typescript", "react", "fastapi", "docker",
    "kubernetes", "aws", "sql", "postgresql", "machine learning", "deep learning",
    "nlp", "pandas", "pytorch", "c++", "data structures", "algorithms", "scikit-learn",
)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
    return text.strip()


def extract_skills(text: str) -> List[str]:
    lowered = (text or "").lower()
    found = set()
    for skill in _TECH_SKILLS:
        if skill in lowered:
            found.add(skill.title())

    nlp = _get_nlp()
    if nlp and lowered:
        doc = nlp(lowered[:8000])
        for token in doc:
            if token.text in _TECH_SKILLS:
                found.add(token.text.title())
        for chunk in doc.noun_chunks:
            if chunk.text in _TECH_SKILLS:
                found.add(chunk.text.title())
    return list(found)


def extract_full_profile(text: str) -> Dict[str, Any]:
    """Pure function: input text in, dict out. No module-level candidate cache."""
    source = text or ""
    profile: Dict[str, Any] = {
        "full_name": "",
        "phone_number": "",
        "location": "",
        "about_bio": "",
        "linkedin_url": "",
        "github_url": "",
        "skills": extract_skills(source),
        "education": [],
        "experience": [],
    }

    email_match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", source)
    if email_match:
        profile["email"] = email_match.group(0)

    phone_match = re.search(r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", source)
    if phone_match:
        profile["phone_number"] = phone_match.group(0)

    linkedin_match = re.search(r"(linkedin\.com/in/[A-Za-z0-9_-]+)", source, re.I)
    if linkedin_match:
        profile["linkedin_url"] = f"https://www.{linkedin_match.group(1)}"

    github_match = re.search(r"(github\.com/[A-Za-z0-9_-]+)", source, re.I)
    if github_match:
        profile["github_url"] = f"https://{github_match.group(1)}"

    nlp = _get_nlp()
    if nlp and source:
        doc = nlp(source[:500])
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                profile["full_name"] = ent.text.strip()
                break

    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", source) if len(p.strip()) > 40]
    if paragraphs:
        profile["about_bio"] = paragraphs[0][:600]

    return profile
