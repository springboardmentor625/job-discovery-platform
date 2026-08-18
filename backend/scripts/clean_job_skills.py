import os
import re
import sys

sys.path.append(
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            ".."
        )
    )
)

from app.database import SessionLocal
from app.models import Job


# ==========================================
# KNOWN SKILLS FROM DATASET
# ==========================================

KNOWN_SKILLS = [
    "MS-Office",
    "MS-Excel",
    "MS-PowerPoint",
    "Data entry",
    "English Proficiency (Spoken)",
    "English Proficiency (Written)",
    "Kannada Proficiency (Spoken)",
    "Hindi Proficiency (Spoken)",
    "Interpersonal skills",
    "Effective Communication",
    "Negotiation",
    "Digital Marketing",
    "Market research",
    "Marketing Strategies",
    "Presentation skills",
    "Legal Research",
    "Company Law",
    "Legal Drafting",
    "Statutory compliances",
    "Legal Writing",
    "Contract Management",
    "Accounting",
    "Tally",
    "Leadership",
    "Team Management",
    "E-commerce",
    "Data Analytics",
    "Mentorship",
    "B2B Sales",
    "Lead Generation",
    "Sales Management",
    "Sales",
    "Problem Solving",
    "Client Relationship Management (CRM)",
    "Sales Support",
    "Customer Support",
    "Sales Strategy",
    "Financial planning",
    "Financial Reporting",
    "Video Editing",
    "Client Relationship",
    "LinkedIn Marketing",
    "Business Development",
    "Google Workspace",
    "Social Media Marketing",
    "Email Marketing",
    "Client Interaction",
    "Public Speaking",
    "Marketing",
    "Customer Acquisition",
]


# ==========================================
# CLEAN SKILLS
# ==========================================

def clean_skills(raw_skills):

    if not raw_skills:
        return ""

    text = str(raw_skills).strip()

    # Remove "+2 more", "+5 more", etc.
    text = re.sub(
        r"\+\d+\s*more",
        "",
        text,
        flags=re.IGNORECASE
    )

    found_skills = []

    # Match known skills from the dataset
    for skill in KNOWN_SKILLS:

        if skill.lower() in text.lower():

            if skill not in found_skills:
                found_skills.append(skill)

    return ", ".join(found_skills)


# ==========================================
# CLEAN DATABASE
# ==========================================

def clean_database():

    db = SessionLocal()

    try:

        jobs = db.query(Job).all()

        print(
            f"Found {len(jobs)} jobs."
        )

        updated = 0

        empty = 0


        for job in jobs:

            cleaned = clean_skills(
                job.skills
            )

            if cleaned:

                job.skills = cleaned

                updated += 1

            else:

                job.skills = None

                empty += 1


        db.commit()


        print()
        print(
            "================================"
        )
        print(
            "SKILL CLEANING COMPLETED"
        )
        print(
            "================================"
        )
        print(
            f"Updated : {updated}"
        )
        print(
            f"Empty   : {empty}"
        )


    except Exception as error:

        db.rollback()

        print(
            "Cleaning failed:"
        )

        print(error)


    finally:

        db.close()


# ==========================================
# RUN
# ==========================================

if __name__ == "__main__":

    clean_database()