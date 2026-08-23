from PyPDF2 import PdfReader


def extract_resume_text(file_path):

    reader = PdfReader(file_path)

    text = ""

    for page in reader.pages:

        page_text = page.extract_text()

        if page_text:

            text += page_text + "\n"

    return text


def extract_skills(text):

    known_skills = [
        "python",
        "java",
        "c++",
        "javascript",
        "typescript",
        "react",
        "node.js",
        "fastapi",
        "django",
        "sql",
        "postgresql",
        "mongodb",
        "docker",
        "aws",
        "git",
        "machine learning",
        "tensorflow",
        "pytorch"
    ]

    text_lower = text.lower()

    found_skills = []

    for skill in known_skills:

        if skill.lower() in text_lower:

            found_skills.append(skill)

    return found_skills