# Before importing, clear the old jobs table: DELETE FROM jobs;

import os
import re
import sys
from collections import Counter

import pandas as pd

# Allow importing the FastAPI app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import Job

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, "naukri_jobs.csv")

SKILL_FALLBACK_PATTERN = re.compile(r"[A-Z][a-z0-9]*(?:[A-Z][a-z0-9]*)*")


def clean_location(value):
    if pd.isna(value):
        return "Not Specified"

    value = str(value).strip()
    if not value:
        return "Not Specified"

    # Naukri locations can contain several comma-separated cities.
    return re.sub(r"\s+", " ", value)


def clean_experience(value):
    if pd.isna(value):
        return None

    value = str(value).strip()
    if not value:
        return None

    match = re.search(r"(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*yrs?", value, re.IGNORECASE)
    if match:
        return f"{match.group(1)} - {match.group(2)} years"

    match = re.search(r"(\d+(?:\.\d+)?)\s*\+?\s*yrs?", value, re.IGNORECASE)
    if match:
        return f"{match.group(1)} years"

    return value


def clean_salary(value):
    if pd.isna(value):
        return "Not Specified"

    value = re.sub(r"\s+", " ", str(value).strip())
    if not value or value.lower() == "not disclosed by recruiter":
        return "Not Specified"

    numbers = re.findall(r"\d[\d,]*(?:\.\d+)?", value)
    numbers = [number.replace(",", "") for number in numbers]

    if len(numbers) >= 2:
        return f"₹{numbers[0]} - ₹{numbers[1]} /year"

    if len(numbers) == 1:
        return f"₹{numbers[0]} /year"

    return "Not Specified"


def detect_skills_delimiter(sample):
    comma_token_counts = []
    for value in sample:
        value = str(value).strip()
        if value:
            comma_token_counts.append(len([token for token in value.split(",") if token.strip()]))

    average_token_count = (
        sum(comma_token_counts) / len(comma_token_counts)
        if comma_token_counts
        else 0
    )

    if average_token_count > 1:
        return "comma"

    return "capitalized-word-boundary"


def clean_skills(value, method):
    if pd.isna(value):
        return ""

    value = str(value).strip()
    if not value:
        return ""

    if method == "comma":
        skills = [token.strip() for token in value.split(",") if token.strip()]
    else:
        skills = SKILL_FALLBACK_PATTERN.findall(value)

    # Preserve order while removing duplicates.
    skills = list(dict.fromkeys(skills))
    return ", ".join(skills)


def import_jobs():
    print(f"Reading dataset: {CSV_PATH}")

    if not os.path.exists(CSV_PATH):
        print(f"CSV file not found: {CSV_PATH}")
        return

    df = pd.read_csv(CSV_PATH)
    print(f"Found {len(df)} job records.")

    required_columns = {"jobtitle", "jobdescription", "skills"}
    missing_columns = required_columns - set(df.columns)
    if missing_columns:
        raise ValueError(
            f"Dataset is missing required columns: {', '.join(sorted(missing_columns))}"
        )

    skill_method = detect_skills_delimiter(df["skills"].head(20).fillna("").tolist())
    print(f"Skills delimiter method: {skill_method}")

    db = SessionLocal()
    imported = 0
    skipped = Counter()

    try:
        for _, row in df.iterrows():
            title = "" if pd.isna(row["jobtitle"]) else str(row["jobtitle"]).strip()
            description = (
                "" if pd.isna(row["jobdescription"])
                else str(row["jobdescription"]).strip()
            )
            raw_skills = "" if pd.isna(row["skills"]) else str(row["skills"]).strip()

            if not title:
                skipped["missing title"] += 1
                continue

            if not description:
                skipped["missing description"] += 1
                continue

            if not raw_skills:
                skipped["missing skills"] += 1
                continue

            job = Job(
                recruiter_id=1,
                title=title,
                company=(
                    "Not Specified"
                    if pd.isna(row.get("company"))
                    else str(row["company"]).strip() or "Not Specified"
                ),
                description=description,
                location=clean_location(row.get("joblocation_address")),
                employment_type="Not Specified",
                experience_required=clean_experience(row.get("experience")),
                salary=clean_salary(row.get("payrate")),
                skills=clean_skills(row["skills"], skill_method),
                status="active",
            )

            db.add(job)
            imported += 1

        db.commit()

        print("\n================================")
        print("JOB IMPORT COMPLETED")
        print("================================")
        print(f"Imported : {imported}")
        print(f"Skipped  : {sum(skipped.values())}")

        if skipped:
            print("Skip reasons:")
            for reason, count in skipped.items():
                print(f"  - {reason}: {count}")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import_jobs()
