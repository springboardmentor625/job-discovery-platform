# Before importing, clear the old jobs table: DELETE FROM jobs;
#
# IMPORTANT: this script extracts skills from TITLE + DESCRIPTION using
# app.services.resume_parser.extract_skills (dictionary + spaCy + Groq,
# same pipeline used for resumes) — it does NOT read the CSV's "skills"
# column. That column is a broad job-category label (only 46 unique
# values across the entire dataset, e.g. "IT Software - Application
# Programming" shared by ~6,000 unrelated jobs), not a real skills list.
#
# The job TITLE is included alongside the description because titles
# often carry unambiguous skill signal ("Senior Java Developer") even
# when the full description is vague corporate boilerplate that yields
# nothing on its own.

import os
import re
import secrets
import sys
import time
import argparse
from collections import Counter

import pandas as pd

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import Job, User
from app.auth import hash_password
from app.services.resume_parser import extract_skills

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, "naukri_jobs.csv")

# Groq's free tier caps at ~30 requests/minute. See fix_job_skills.py's
# module docstring for the full reasoning — same trade-off here:
# --no-llm skips Groq entirely (fast, dictionary/spaCy only, already
# fixes the core problem for most jobs), --rpm throttles proactively
# when Groq is used.
DEFAULT_LIMIT = 3000
DEFAULT_RPM = 25

# Jobs need a valid recruiter_id (a real row in users.user_id — that's a
# foreign key). There is no dedicated recruiter/admin signup flow in this
# project yet (registration always creates role="candidate" users), so
# imported jobs are attributed to one dedicated system account instead of
# assuming a specific numeric ID exists.
SYSTEM_RECRUITER_EMAIL = "system@jobdiscovery.local"
SYSTEM_RECRUITER_NAME = "SwipeX Job Import"
SYSTEM_RECRUITER_PHONE = "0000000000"


def get_or_create_system_recruiter(db):
    """Return the id of the dedicated system recruiter, creating it once.

    Previously this script hardcoded `recruiter_id=1`, which assumed a
    user with that exact ID already existed — on a fresh database (or
    any database where user #1 isn't a recruiter, or doesn't exist yet)
    every single job insert would fail on the recruiter_id foreign key.
    This looks the system account up by its fixed email first, so
    re-running the importer never creates a duplicate.
    """
    existing = (
        db.query(User)
        .filter(User.email == SYSTEM_RECRUITER_EMAIL)
        .first()
    )
    if existing:
        return existing.user_id

    system_user = User(
        full_name=SYSTEM_RECRUITER_NAME,
        email=SYSTEM_RECRUITER_EMAIL,
        # Not a real login — nobody signs in as this account — but
        # password_hash is NOT NULL, so it still needs a properly
        # hashed, unguessable value rather than a placeholder string.
        password_hash=hash_password(secrets.token_urlsafe(32)),
        role="recruiter",
        phone=SYSTEM_RECRUITER_PHONE,
        is_verified=True,
    )
    db.add(system_user)
    db.commit()
    db.refresh(system_user)
    print(f"Created system recruiter account (user_id={system_user.user_id}).")
    return system_user.user_id


def clean_location(value):
    if pd.isna(value):
        return "Not Specified"

    value = str(value).strip()
    if not value:
        return "Not Specified"

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


def import_jobs(limit=DEFAULT_LIMIT, use_llm=True, rpm=DEFAULT_RPM):
    print(f"Reading dataset: {CSV_PATH}")

    if not use_llm:
        os.environ["GROQ_API_KEY"] = ""
        print("--no-llm set: dictionary + spaCy extraction only, no Groq calls.")
    else:
        sleep_seconds = 60.0 / rpm
        print(f"Groq enabled, throttled to {rpm} requests/min ({sleep_seconds:.1f}s between calls).")

    if not os.path.exists(CSV_PATH):
        print(f"CSV file not found: {CSV_PATH}")
        return

    df = pd.read_csv(CSV_PATH)
    print(f"Found {len(df)} job records.")

    required_columns = {"jobtitle", "jobdescription"}
    missing_columns = required_columns - set(df.columns)
    if missing_columns:
        raise ValueError(
            f"Dataset is missing required columns: {', '.join(sorted(missing_columns))}"
        )

    if limit and limit > 0 and limit < len(df):
        print(
            f"Limiting import to the first {limit} rows — use --limit 0 "
            f"to import all {len(df)} rows."
        )
        df = df.head(limit)

    db = SessionLocal()
    imported = 0
    skipped = Counter()
    no_skills_extracted = 0
    started_at = time.time()

    try:
        recruiter_id = get_or_create_system_recruiter(db)

        for i, (_, row) in enumerate(df.iterrows()):
            title = "" if pd.isna(row["jobtitle"]) else str(row["jobtitle"]).strip()
            description = (
                "" if pd.isna(row["jobdescription"])
                else str(row["jobdescription"]).strip()
            )

            if not title:
                skipped["missing title"] += 1
                continue

            if not description:
                skipped["missing description"] += 1
                continue

            # ======================================
            # THE FIX: extract from TITLE + DESCRIPTION
            # combined, not the broken "skills" column.
            # Title first, since it's short and often
            # the clearest skill signal in the row.
            # ======================================
            extraction_text = f"{title}. {description}"
            extracted_skills = extract_skills(extraction_text)

            if not extracted_skills:
                no_skills_extracted += 1

            if use_llm:
                time.sleep(60.0 / rpm)

            job = Job(
                recruiter_id=recruiter_id,
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
                skills=extracted_skills,
                status="active",
            )

            db.add(job)
            imported += 1

            if (i + 1) % 100 == 0:
                elapsed = time.time() - started_at
                print(f"  ...{i + 1} rows processed ({imported} imported, {elapsed:.0f}s elapsed)")
                db.commit()

        db.commit()

        print("\n================================")
        print("JOB IMPORT COMPLETED")
        print("================================")
        print(f"Imported            : {imported}")
        print(f"Skipped             : {sum(skipped.values())}")
        print(f"No skills extracted : {no_skills_extracted}  (title+description too vague — see job_routes.py's semantic-similarity fallback for how these are still scored fairly)")
        print(f"Total time          : {time.time() - started_at:.0f}s")

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
    parser = argparse.ArgumentParser(description="Import jobs with real extracted skills.")
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT, help=f"Max rows to import (default {DEFAULT_LIMIT}). Use 0 for all rows.")
    parser.add_argument("--no-llm", action="store_true", help="Skip Groq entirely — dictionary/spaCy extraction only.")
    parser.add_argument("--rpm", type=int, default=DEFAULT_RPM, help=f"When Groq is enabled, max requests/minute (default {DEFAULT_RPM}).")
    args = parser.parse_args()
    import_jobs(limit=args.limit, use_llm=not args.no_llm, rpm=args.rpm)
