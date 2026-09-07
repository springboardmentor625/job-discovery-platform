import os

from docx import Document
from PyPDF2 import PdfReader


# =========================================================
# SKILLS AVAILABLE IN SWIPEX
# =========================================================

EXISTING_SKILLS = [
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
    "CSS",
    "Tailwind CSS",
    "Bootstrap",
    "SQL",
    "MySQL",
    "PostgreSQL",
    "MongoDB",
    "Git",
    "GitHub",
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
]


# =========================================================
# EXTRACT TEXT FROM DOCX
# =========================================================

def extract_text_from_docx(file_path: str) -> str:

    document = Document(file_path)

    paragraphs = []

    for paragraph in document.paragraphs:
        if paragraph.text.strip():
            paragraphs.append(paragraph.text)

    return "\n".join(paragraphs)


# =========================================================
# EXTRACT TEXT FROM PDF
# =========================================================

def extract_text_from_pdf(file_path: str) -> str:

    reader = PdfReader(file_path)

    pages = []

    for page in reader.pages:
        text = page.extract_text()

        if text:
            pages.append(text)

    return "\n".join(pages)


# =========================================================
# EXTRACT TEXT FROM RESUME
# =========================================================

def extract_resume_text(file_path: str) -> str:

    extension = os.path.splitext(file_path)[1].lower()

    if extension == ".docx":
        return extract_text_from_docx(file_path)

    if extension == ".pdf":
        return extract_text_from_pdf(file_path)

    raise ValueError(
        "Unsupported resume format. "
        "Only PDF and DOCX are supported."
    )


# =========================================================
# EXTRACT SKILLS
# =========================================================

def extract_skills(text: str):

    text_lower = text.lower()

    found_skills = []

    for skill in EXISTING_SKILLS:

        skill_lower = skill.lower()

        if skill_lower in text_lower:

            if skill not in found_skills:
                found_skills.append(skill)

    return found_skills
