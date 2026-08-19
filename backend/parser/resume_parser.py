import pdfplumber
from docx import Document
import re


# =====================================
# SKILLS DATABASE
# =====================================

SKILLS = [
    "Python",
    "Java",
    "C",
    "C++",
    "C#",
    "JavaScript",
    "TypeScript",
    "React",
    "Angular",
    "Vue",
    "Node.js",
    "Express",
    "Django",
    "Flask",
    "FastAPI",
    "HTML",
    "CSS",
    "Tailwind",
    "SQL",
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Redis",
    "AWS",
    "Azure",
    "Git",
    "GitHub",
    "Docker",
    "Kubernetes",
    "REST API",
    "Machine Learning",
    "Deep Learning",
    "TensorFlow",
    "PyTorch",
    "Pandas",
    "NumPy",
]


# =====================================
# EXTRACT TEXT
# =====================================

def extract_text(file_path):

    extension = file_path.split(".")[-1].lower()

    # ---------------------------------
    # PDF
    # ---------------------------------

    if extension == "pdf":

        text = ""

        try:

            with pdfplumber.open(file_path) as pdf:

                for page in pdf.pages:

                    page_text = page.extract_text()

                    if page_text:
                        text += page_text + "\n"

        except Exception as e:

            print("PDF EXTRACTION ERROR:", e)

            return ""

        return text


    # ---------------------------------
    # DOCX
    # ---------------------------------

    elif extension == "docx":

        try:

            doc = Document(file_path)

            paragraphs = []

            for paragraph in doc.paragraphs:

                if paragraph.text.strip():

                    paragraphs.append(
                        paragraph.text.strip()
                    )

            return "\n".join(paragraphs)

        except Exception as e:

            print("DOCX EXTRACTION ERROR:", e)

            return ""


    return ""


# =====================================
# EXTRACT SKILLS
# =====================================

def extract_skills(text):

    skills = []

    lower_text = text.lower()

    for skill in SKILLS:

        skill_lower = skill.lower()

        # Word boundary for normal skills
        pattern = r"(?<!\w)" + re.escape(skill_lower) + r"(?!\w)"

        if re.search(pattern, lower_text):

            skills.append(skill)

    return skills


# =====================================
# EXTRACT EMAIL
# =====================================

def extract_email(text):

    emails = re.findall(
        r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
        text
    )

    if emails:

        return emails[0]

    return ""


# =====================================
# EXTRACT PHONE
# =====================================

def extract_phone(text):

    phones = re.findall(
        r"(?:\+91[\s-]?)?[6-9]\d{9}",
        text
    )

    if phones:

        return phones[0]

    # fallback for other formats

    phones = re.findall(
        r"\+?\d[\d\s().-]{8,18}\d",
        text
    )

    if phones:

        return phones[0].strip()

    return ""


# =====================================
# EXTRACT EXPERIENCE
# =====================================

def extract_experience(text):

    lower_text = text.lower()

    # Examples:
    # 2 years
    # 2+ years
    # 3 yrs
    # 1 year experience

    patterns = [
        r"\d+\+?\s+years?\s+(?:of\s+)?experience",
        r"\d+\+?\s+years?",
        r"\d+\+?\s+yrs?",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            lower_text
        )

        if match:

            return match.group(0)

    # Fresher

    if "fresher" in lower_text:

        return "Fresher"

    if "intern" in lower_text:

        return "Intern"

    return ""


# =====================================
# EXTRACT EDUCATION
# =====================================

def extract_education(text):

    lower_text = text.lower()

    education_keywords = [

        "b.tech",
        "btech",
        "b.e",
        "be ",
        "bachelor of technology",
        "bachelor of engineering",
        "bachelor's",

        "m.tech",
        "mtech",
        "m.e",
        "master of technology",
        "master of engineering",
        "master's",

        "b.sc",
        "bsc",
        "bachelor of science",

        "m.sc",
        "msc",
        "master of science",

        "mba",

        "bca",
        "mca",

    ]

    for keyword in education_keywords:

        if keyword in lower_text:

            return keyword.strip()

    return ""


# =====================================
# PROJECTS
# =====================================

def extract_projects(text):

    lower_text = text.lower()

    project_keywords = [
        "project",
        "projects",
        "developed",
        "built",
        "created",
        "implemented",
    ]

    for keyword in project_keywords:

        if keyword in lower_text:

            return "Yes"

    return ""


# =====================================
# CERTIFICATIONS
# =====================================

def extract_certifications(text):

    lower_text = text.lower()

    certification_keywords = [
        "certification",
        "certifications",
        "certified",
        "certificate",
    ]

    for keyword in certification_keywords:

        if keyword in lower_text:

            return "Yes"

    return ""


# =====================================
# MAIN PARSER
# =====================================

def parse_resume(file_path):

    print("=================================")
    print("PARSING RESUME")
    print("FILE:", file_path)
    print("=================================")

    # ---------------------------------
    # TEXT
    # ---------------------------------

    text = extract_text(file_path)

    if not text:

        print("NO TEXT EXTRACTED FROM RESUME")

        return {
            "text": "",
            "skills": [],
            "email": "",
            "phone": "",
            "experience": "",
            "education": "",
            "projects": "",
            "certifications": "",
        }

    print("TEXT EXTRACTED")

    # ---------------------------------
    # PARSE
    # ---------------------------------

    skills = extract_skills(text)

    email = extract_email(text)

    phone = extract_phone(text)

    experience = extract_experience(text)

    education = extract_education(text)

    projects = extract_projects(text)

    certifications = extract_certifications(text)

    result = {

        "text": text,

        "skills": skills,

        "email": email,

        "phone": phone,

        "experience": experience,

        "education": education,

        "projects": projects,

        "certifications": certifications,
    }

    # ---------------------------------
    # DEBUG
    # ---------------------------------

    print("=================================")
    print("PARSED RESUME")
    print("SKILLS:", skills)
    print("EMAIL:", email)
    print("PHONE:", phone)
    print("EXPERIENCE:", experience)
    print("EDUCATION:", education)
    print("PROJECTS:", projects)
    print("CERTIFICATIONS:", certifications)
    print("=================================")

    return result
