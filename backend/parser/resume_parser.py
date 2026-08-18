import pdfplumber
from docx import Document
import spacy
import re

nlp = spacy.load("en_core_web_sm")

SKILLS = [
    "Python", "Java", "C", "C++", "JavaScript",
    "React", "Angular", "Node.js", "Django",
    "Flask", "HTML", "CSS", "SQL",
    "PostgreSQL", "MySQL", "MongoDB",
    "AWS", "Git", "Docker", "Kubernetes"
]


def extract_text(file_path):
    extension = file_path.split(".")[-1].lower()

    if extension == "pdf":
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text

    elif extension == "docx":
        doc = Document(file_path)
        return "\n".join([p.text for p in doc.paragraphs])

    return ""


def parse_resume(file_path):

    text = extract_text(file_path)

    lower_text = text.lower()

    skills = []

    for skill in SKILLS:
        if skill.lower() in lower_text:
            skills.append(skill)

    emails = re.findall(
        r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
        text
    )

    phones = re.findall(
        r"\+?\d[\d\s-]{8,15}",
        text
    )

    experience = ""

    experience_keywords = [
        "fresher",
        "intern",
        "1 year",
        "2 years",
        "3 years",
        "4 years",
        "5 years",
    ]

    for item in experience_keywords:
        if item in lower_text:
            experience = item
            break

    education = ""

    education_keywords = [
        "b.tech",
        "b.e",
        "bachelor",
        "m.tech",
        "master",
        "bsc",
        "msc",
        "mba",
    ]

    for item in education_keywords:
        if item in lower_text:
            education = item
            break

    projects = "Yes" if "project" in lower_text else ""

    certifications = "Yes" if "certification" in lower_text else ""

    return {
        "text": text,
        "skills": skills,
        "email": emails[0] if emails else "",
        "phone": phones[0] if phones else "",
        "experience": experience,
        "education": education,
        "projects": projects,
        "certifications": certifications,
    }