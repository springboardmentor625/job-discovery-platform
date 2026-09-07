from app.resume_parser import (
    extract_resume_text,
    extract_skills
)


FILE_PATH = "uploads/aacaf87398774b688a174f0fcf7bfe44.docx"


try:

    text = extract_resume_text(FILE_PATH)

    print("\n================ RESUME TEXT ================\n")

    print(text)

    skills = extract_skills(text)

    print("\n================ EXTRACTED SKILLS ================\n")

    print(skills)

except Exception as e:

    print("\nERROR:")
    print(e)