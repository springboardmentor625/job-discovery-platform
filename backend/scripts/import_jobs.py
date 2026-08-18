import os
import re
import sys

import pandas as pd

# Allow importing the FastAPI app modules
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
# DATASET PATH
# ==========================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

CSV_PATH = os.path.join(
    BASE_DIR,
    "Job_dataset.csv"
)


# ==========================================
# CLEAN LOCATION
# ==========================================

def clean_location(value):

    if pd.isna(value):
        return "Not Specified"

    value = str(value).strip()

    # Remove Hybrid / Remote information
    value = re.sub(
        r"\s*\(.*?\)",
        "",
        value
    )

    return value.strip()


# ==========================================
# EXTRACT EXPERIENCE
# ==========================================

def clean_experience(value):

    if pd.isna(value):
        return None

    value = str(value)

    match = re.search(
        r"(\d+(?:\.\d+)?)",
        value
    )

    if match:
        return match.group(1)

    return None


# ==========================================
# CLEAN SALARY
# ==========================================

def clean_salary(value):

    if pd.isna(value):
        return "Not Specified"

    value = str(value)

    numbers = re.findall(
        r"[\d,]+",
        value
    )

    numbers = [
        number.replace(",", "")
        for number in numbers
    ]

    if len(numbers) >= 2:

        return (
            f"₹{numbers[0]} - "
            f"₹{numbers[1]} /year"
        )

    if len(numbers) == 1:

        return (
            f"₹{numbers[0]} /year"
        )

    return "Not Specified"


# ==========================================
# CLEAN SKILLS
# ==========================================

def clean_skills(value):

    if pd.isna(value):
        return "Not Specified"

    value = str(value).strip()

    if not value:
        return "Not Specified"

    return value


# ==========================================
# CREATE TEMPORARY JOB TITLE
# ==========================================

def create_job_title(skills):

    if not skills or skills == "Not Specified":
        return "Job Opportunity"

    # Use first skill as temporary title
    first_skill = skills.split(
        "MS-"
    )[0].strip()

    if first_skill:
        return f"{first_skill} Opportunity"

    return "Job Opportunity"


# ==========================================
# IMPORT JOBS
# ==========================================

def import_jobs():

    print(
        "Reading dataset..."
    )

    if not os.path.exists(CSV_PATH):

        print(
            f"CSV file not found: {CSV_PATH}"
        )

        return


    df = pd.read_csv(
        CSV_PATH
    )

    print(
        f"Found {len(df)} job records."
    )


    db = SessionLocal()


    try:

        imported = 0

        skipped = 0


        for _, row in df.iterrows():

            try:

                company = str(
                    row["Company Name"]
                ).strip()


                if not company:

                    skipped += 1

                    continue


                location = clean_location(
                    row["Locations"]
                )


                salary = clean_salary(
                    row["Salary"]
                )


                experience = clean_experience(
                    row["Experience"]
                )


                skills = clean_skills(
                    row["Skills"]
                )


                title = create_job_title(
                    skills
                )


                job = Job(

                    recruiter_id=1,

                    title=title,

                    company=company,

                    description=(
                        "Job opportunity "
                        "imported from the "
                        "temporary Kaggle dataset."
                    ),

                    location=location,

                    employment_type=(
                        "Not Specified"
                    ),

                    experience_required=(
                        experience
                    ),

                    salary=salary,

                    skills=skills,

                    status="active"

                )


                db.add(job)

                imported += 1


            except Exception as error:

                print(
                    "Skipped row:",
                    error
                )

                skipped += 1


        db.commit()


        print(
            "\n================================"
        )

        print(
            "JOB IMPORT COMPLETED"
        )

        print(
            "================================"
        )

        print(
            f"Imported : {imported}"
        )

        print(
            f"Skipped  : {skipped}"
        )


    except Exception as error:

        db.rollback()

        print(
            "Import failed:"
        )

        print(error)


    finally:

        db.close()


# ==========================================
# RUN
# ==========================================

if __name__ == "__main__":

    import_jobs()