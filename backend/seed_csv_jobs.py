

import os
import re
import pandas as pd
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models import Company, Job


# ============================================================
# CONFIGURATION
# ============================================================

EXCEL_PATH = "data/indian-job-market-dataset-2025.xlsx"

LEGACY_COMPANY_NAMES = [
    "SwipeX Dataset Jobs"
]

CANONICAL_COMPANY_NAME = "SwipeX Job Dataset"

# Database VARCHAR limits
MAX_TITLE_LENGTH = 150
MAX_LOCATION_LENGTH = 150
MAX_COMPANY_NAME_LENGTH = 200

# Commit jobs in batches instead of one huge transaction
BATCH_SIZE = 500


# ============================================================
# TEXT CLEANING
# ============================================================

def clean_text(value):
    """
    Convert a value into clean text.

    Handles:
    - None
    - NaN
    - extra spaces
    - line breaks
    """

    if value is None:
        return ""

    try:
        if pd.isna(value):
            return ""
    except (TypeError, ValueError):
        pass

    text = str(value).strip()

    if not text:
        return ""

    text = re.sub(r"\s+", " ", text)

    return text.strip()


def clean_db_text(value, max_length):
    """
    Clean text and safely limit it to the database column size.
    """

    text = clean_text(value)

    if not text:
        return ""

    return text[:max_length].strip()


# ============================================================
# SKILL CLEANING
# ============================================================

def is_valid_skill(skill):
    """
    Check whether a value looks like an actual skill.

    Skills come from tagsAndSkills.
    """

    skill = clean_text(skill)

    if not skill:
        return False

    # Avoid extremely long skill entries
    if len(skill) > 100:
        return False

    words = skill.split()

    # Avoid complete sentences accidentally appearing as skills
    if len(words) > 12:
        return False

    sentence_patterns = [
        r"^developed\b",
        r"^developing\b",
        r"^executed\b",
        r"^revised\b",
        r"^researched\b",
        r"^reduced\b",
        r"^responsible for\b",
        r"^experience in\b",
        r"^ability to\b",
        r"^knowledge of\b",
        r"^proficient in\b",
        r"^worked on\b",
        r"^managed\b",
        r"^implemented\b",
        r"^maintained\b",
        r"^performed\b",
        r"^provided\b",
        r"^assisted\b",
        r"^should be\b",
        r"^must be\b",
        r"^will be\b",
    ]

    lowered = skill.lower()

    for pattern in sentence_patterns:
        if re.search(pattern, lowered):
            return False

    # Long sentence-like values ending with a period
    if skill.endswith(".") and len(words) >= 5:
        return False

    return True


def flatten_skill_value(value):
    """
    Convert a skill field into a flat list.

    Supports:
    - comma-separated skills
    - semicolon-separated skills
    - newline-separated skills
    - pipe-separated skills
    - Python-list-like strings
    """

    if value is None:
        return []

    try:
        if pd.isna(value):
            return []
    except (TypeError, ValueError):
        pass

    if isinstance(value, (list, tuple, set)):
        result = []

        for item in value:
            result.extend(
                flatten_skill_value(item)
            )

        return result

    text = str(value).strip()

    if not text:
        return []

    # Handle strings such as:
    # ["Python", "React", "SQL"]
    if text.startswith("[") and text.endswith("]"):

        try:
            import ast

            parsed = ast.literal_eval(text)

            if isinstance(
                parsed,
                (list, tuple, set),
            ):
                return flatten_skill_value(
                    parsed
                )

        except (
            ValueError,
            SyntaxError,
        ):
            pass

    # Split skill lists
    parts = re.split(
        r"[\n,;|]+",
        text
    )

    return [
        part.strip()
        for part in parts
        if part.strip()
    ]


def parse_skills(value):
    """
    Clean and deduplicate skills.
    """

    raw_skills = flatten_skill_value(
        value
    )

    cleaned_skills = []

    seen = set()

    for skill in raw_skills:

        skill = clean_text(skill)

        if not skill:
            continue

        if not is_valid_skill(skill):
            continue

        # Remove unwanted punctuation
        skill = skill.strip(
            " .,:;"
        )

        if not skill:
            continue

        normalized = skill.lower()

        if normalized in seen:
            continue

        seen.add(normalized)

        cleaned_skills.append(
            skill
        )

    return cleaned_skills


# ============================================================
# EXPERIENCE
# ============================================================

def extract_experience(value):
    """
    Extract the first numeric experience value.

    Examples:

        "2 - 5 years" -> 2
        "3 years"     -> 3
        "5+"          -> 5
    """

    text = clean_text(value)

    if not text:
        return 0

    numbers = re.findall(
        r"\d+(?:\.\d+)?",
        text
    )

    if not numbers:
        return 0

    try:
        return int(
            float(numbers[0])
        )

    except (
        ValueError,
        TypeError,
    ):
        return 0


# ============================================================
# DESCRIPTION
# ============================================================

def create_description(row):
    """
    Use the dataset's actual jobDescription field.

    Skills are NOT extracted from description.
    """

    description = clean_text(
        row.get(
            "jobDescription",
            ""
        )
    )

    if description:
        return description

    title = clean_text(
        row.get(
            "title",
            ""
        )
    )

    if title:
        return (
            f"Job opportunity for {title}."
        )

    return (
        "Job opportunity available through SwipeX."
    )


# ============================================================
# REQUIRED SKILLS
# ============================================================

def get_required_skills(row):
    """
    Extract required skills ONLY from tagsAndSkills.
    """

    return parse_skills(
        row.get(
            "tagsAndSkills",
            ""
        )
    )


# ============================================================
# SKILL QUALITY
# ============================================================

def skill_quality_score(row):
    """
    Score a row based on the quality/number of skills.
    """

    skills = get_required_skills(
        row
    )

    return len(skills)


# ============================================================
# CLOSE OLD DEMO JOBS
# ============================================================

def close_old_demo_jobs(db):
    """
    Close the original demo jobs.
    """

    old_job_ids = [
        1,
        2,
        3,
    ]

    jobs = (
        db.query(Job)
        .filter(
            Job.job_id.in_(
                old_job_ids
            )
        )
        .all()
    )

    for job in jobs:

        job.status = "CLOSED"

    db.commit()

    print(
        f"Closed {len(jobs)} old demo job(s)."
    )


# ============================================================
# CLOSE LEGACY DATASET JOBS
# ============================================================

def close_legacy_dataset_jobs(db):
    """
    Close jobs belonging to the previous dataset company.
    """

    company_names = list(
        LEGACY_COMPANY_NAMES
    )

    company_names.append(
        CANONICAL_COMPANY_NAME
    )

    legacy_companies = (
        db.query(Company)
        .filter(
            Company.company_name.in_(
                company_names
            )
        )
        .all()
    )

    if not legacy_companies:

        print(
            "No previous dataset companies found."
        )

        return

    total_closed = 0

    for company in legacy_companies:

        jobs = (
            db.query(Job)
            .filter(
                Job.company_id
                == company.company_id,
                Job.status == "ACTIVE",
            )
            .all()
        )

        for job in jobs:

            job.status = "CLOSED"

            total_closed += 1

    db.commit()

    print(
        f"Closed {total_closed} previous dataset job(s)."
    )


# ============================================================
# COMPANY CACHE
# ============================================================

def load_company_cache(db):
    """
    Load existing companies into a dictionary.

    This avoids repeatedly querying PostgreSQL for
    the same company name.
    """

    companies = (
        db.query(Company)
        .all()
    )

    company_cache = {}

    for company in companies:

        normalized_name = clean_text(
            company.company_name
        ).lower()

        if normalized_name:

            company_cache[
                normalized_name
            ] = company

    print(
        f"Loaded {len(company_cache)} existing company record(s)."
    )

    return company_cache


def get_or_create_company(
    db,
    company_name,
    company_cache,
):
    """
    Get an existing company or create a new one.

    The company's actual name comes from the dataset's
    companyName column.
    """

    company_name = clean_db_text(
        company_name,
        MAX_COMPANY_NAME_LENGTH,
    )

    # If dataset company name is missing,
    # use a safe fallback.
    if not company_name:

        company_name = (
            CANONICAL_COMPANY_NAME
        )

    normalized_name = (
        company_name.lower()
    )

    existing_company = (
        company_cache.get(
            normalized_name
        )
    )

    if existing_company:

        return existing_company

    new_company = Company(
        company_name=company_name
    )

    db.add(
        new_company
    )

    db.flush()

    company_cache[
        normalized_name
    ] = new_company

    return new_company


# ============================================================
# LOAD EXCEL DATASET
# ============================================================

def load_excel():
    """
    Load the Indian Job Market Excel dataset.
    """

    if not os.path.exists(
        EXCEL_PATH
    ):

        raise FileNotFoundError(
            "\nIndian Job Market dataset not found.\n"
            f"Expected file:\n  {EXCEL_PATH}\n"
        )

    print(
        f"Loading Excel dataset: {EXCEL_PATH}"
    )

    df = pd.read_excel(
        EXCEL_PATH,
        engine="openpyxl",
    )

    print(
        f"Loaded {len(df)} dataset rows."
    )

    print(
        f"Dataset columns: {list(df.columns)}"
    )

    return df


# ============================================================
# PREPARE JOBS
# ============================================================

def prepare_jobs(df):
    """
    Prepare the dataset before inserting into PostgreSQL.

    Steps:
    1. Validate required columns
    2. Clean job titles
    3. Extract skills from tagsAndSkills
    4. Calculate skill quality
    5. Remove duplicate job titles
    6. Prefer rows containing more valid skills
    """

    required_columns = [
        "title",
        "tagsAndSkills",
        "jobDescription",
        "experience",
        "location",
        "minimumSalary",
        "maximumSalary",
        "minimumExperience",
        "maximumExperience",
        "companyName",
        "jobUploaded",
    ]

    for column in required_columns:

        if column not in df.columns:

            print(
                f"Warning: missing column '{column}'. "
                "Creating empty column."
            )

            df[column] = ""

    # Replace NaN values
    df = df.fillna("")

    # Clean title
    df["title"] = df[
        "title"
    ].apply(
        clean_text
    )

    # Clean company name
    df["companyName"] = df[
        "companyName"
    ].apply(
        clean_text
    )

    # Remove rows without titles
    df = df[
        df["title"] != ""
    ].copy()

    # Extract skills
    print(
        "\nPreparing skills..."
    )

    df["_skills"] = df.apply(
        get_required_skills,
        axis=1,
    )

    # Skill quality
    df["_skill_quality"] = df[
        "_skills"
    ].apply(
        len
    )

    # Completeness
    completeness_columns = [
        "jobDescription",
        "experience",
        "location",
        "tagsAndSkills",
        "minimumSalary",
        "maximumSalary",
        "companyName",
    ]

    df["_completeness"] = df[
        completeness_columns
    ].apply(
        lambda row: sum(
            1
            for value in row
            if clean_text(value)
        ),
        axis=1,
    )

    # Preserve original order
    df["_original_order"] = range(
        len(df)
    )

    # Prefer rows with:
    # 1. More skills
    # 2. More complete information
    # 3. Earlier original position
    df = df.sort_values(
        by=[
            "_skill_quality",
            "_completeness",
            "_original_order",
        ],
        ascending=[
            False,
            False,
            True,
        ],
    )

    # One representative row per job title
    representative_rows = (
        df.drop_duplicates(
            subset=[
                "title"
            ],
            keep="first",
        )
        .copy()
    )

    valid_skill_count = sum(
        1
        for skills in representative_rows[
            "_skills"
        ]
        if skills
    )

    invalid_skill_count = (
        len(
            representative_rows
        )
        - valid_skill_count
    )

    company_count = (
        representative_rows[
            "companyName"
        ]
        .apply(
            clean_text
        )
        .replace(
            "",
            pd.NA
        )
        .nunique()
    )

    print(
        f"Prepared {len(representative_rows)} "
        f"unique job title(s)."
    )

    print(
        f"Jobs with valid skills: "
        f"{valid_skill_count}"
    )

    print(
        f"Jobs without valid skills: "
        f"{invalid_skill_count}"
    )

    print(
        f"Distinct dataset companies represented: "
        f"{company_count}"
    )

    return representative_rows


# ============================================================
# SALARY
# ============================================================

def extract_salary(value):
    """
    Convert salary values safely into numbers.

    Returns None when a valid numeric value is unavailable.
    """

    if value is None:
        return None

    try:

        if pd.isna(value):
            return None

    except (
        TypeError,
        ValueError,
    ):
        pass

    text = str(value).strip()

    if not text:
        return None

    # Remove commas
    text = text.replace(
        ",",
        ""
    )

    match = re.search(
        r"\d+(?:\.\d+)?",
        text,
    )

    if not match:
        return None

    try:

        return float(
            match.group()
        )

    except (
        ValueError,
        TypeError,
    ):
        return None


# ============================================================
# POSTED DATE
# ============================================================

def extract_posted_date(value):
    """
    Convert jobUploaded into a datetime.

    Falls back to current UTC time.
    """

    if value is None:

        return datetime.now(
            timezone.utc
        )

    try:

        if pd.isna(value):

            return datetime.now(
                timezone.utc
            )

    except (
        TypeError,
        ValueError,
    ):
        pass

    try:

        parsed = pd.to_datetime(
            value,
            errors="coerce",
        )

        if pd.isna(parsed):

            return datetime.now(
                timezone.utc
            )

        result = (
            parsed.to_pydatetime()
        )

        return result

    except Exception:

        return datetime.now(
            timezone.utc
        )


# ============================================================
# INSERT / UPDATE JOBS
# ============================================================

def insert_jobs(
    db,
    df,
    company_cache,
):
    """
    Insert or update jobs.

    IMPORTANT:
    Each job now uses the actual companyName from the
    dataset instead of one canonical company.

    Existing database jobs belonging to previous dataset
    companies were already closed before this function runs.
    """

    inserted = 0
    updated = 0

    batch_counter = 0

    total_rows = len(df)

    print(
        f"\nProcessing {total_rows} jobs..."
    )

    for index, (_, row) in enumerate(
        df.iterrows(),
        start=1,
    ):

        # ----------------------------------------------------
        # TITLE
        # ----------------------------------------------------

        original_title = clean_text(
            row.get(
                "title",
                ""
            )
        )

        if not original_title:
            continue

        title = clean_db_text(
            original_title,
            MAX_TITLE_LENGTH,
        )

        if not title:
            continue

        # ----------------------------------------------------
        # COMPANY NAME
        # ----------------------------------------------------

        dataset_company_name = clean_text(
            row.get(
                "companyName",
                ""
            )
        )

        company = get_or_create_company(
            db,
            dataset_company_name,
            company_cache,
        )

        # ----------------------------------------------------
        # LOCATION
        # ----------------------------------------------------

        location = clean_db_text(
            row.get(
                "location",
                ""
            ),
            MAX_LOCATION_LENGTH,
        )

        # ----------------------------------------------------
        # DESCRIPTION
        # ----------------------------------------------------

        description = create_description(
            row
        )

        # ----------------------------------------------------
        # SKILLS
        # ----------------------------------------------------

        required_skills = get_required_skills(
            row
        )

        # ----------------------------------------------------
        # EXPERIENCE
        # ----------------------------------------------------

        experience_required = (
            extract_experience(
                row.get(
                    "experience",
                    ""
                )
            )
        )

        minimum_experience = (
            extract_experience(
                row.get(
                    "minimumExperience",
                    ""
                )
            )
        )

        if minimum_experience > 0:

            experience_required = (
                minimum_experience
            )

        # ----------------------------------------------------
        # SALARY
        # ----------------------------------------------------

        salary_min = extract_salary(
            row.get(
                "minimumSalary",
                ""
            )
        )

        salary_max = extract_salary(
            row.get(
                "maximumSalary",
                ""
            )
        )

        # ----------------------------------------------------
        # DATE
        # ----------------------------------------------------

        posted_date = extract_posted_date(
            row.get(
                "jobUploaded",
                ""
            )
        )

        # ----------------------------------------------------
        # EMPLOYMENT TYPE
        # ----------------------------------------------------

        employment_type = "FULL_TIME"

        # ----------------------------------------------------
        # FIND EXISTING JOB
        # ----------------------------------------------------
        #
        # Company + title identifies the dataset job.
        #
        # This is important because the same job title can
        # legitimately exist at different companies.
        #
        # ----------------------------------------------------

        existing_job = (
            db.query(Job)
            .filter(
                Job.company_id
                == company.company_id,
                Job.title == title,
            )
            .first()
        )

        # ----------------------------------------------------
        # UPDATE
        # ----------------------------------------------------

        if existing_job:

            existing_job.description = (
                description
            )

            existing_job.location = (
                location
            )

            existing_job.employment_type = (
                employment_type
            )

            existing_job.salary_min = (
                salary_min
            )

            existing_job.salary_max = (
                salary_max
            )

            existing_job.experience_required = (
                experience_required
            )

            existing_job.required_skills = (
                required_skills
            )

            existing_job.posted_date = (
                posted_date
            )

            existing_job.status = "ACTIVE"

            updated += 1

        # ----------------------------------------------------
        # INSERT
        # ----------------------------------------------------

        else:

            new_job = Job(
                company_id=(
                    company.company_id
                ),

                title=title,

                description=description,

                location=location,

                employment_type=(
                    employment_type
                ),

                salary_min=(
                    salary_min
                ),

                salary_max=(
                    salary_max
                ),

                experience_required=(
                    experience_required
                ),

                required_skills=(
                    required_skills
                ),

                posted_date=(
                    posted_date
                ),

                status="ACTIVE",
            )

            db.add(
                new_job
            )

            inserted += 1

        batch_counter += 1

        # ----------------------------------------------------
        # BATCH COMMIT
        # ----------------------------------------------------

        if batch_counter >= BATCH_SIZE:

            try:

                db.commit()

                print(
                    f"Processed "
                    f"{index}/{total_rows} jobs "
                    f"| Inserted: {inserted} "
                    f"| Updated: {updated}"
                )

                batch_counter = 0

            except Exception:

                db.rollback()

                print(
                    "\nERROR while committing "
                    f"batch around row {index}."
                )

                raise

    # --------------------------------------------------------
    # FINAL COMMIT
    # --------------------------------------------------------

    if batch_counter > 0:

        try:

            db.commit()

        except Exception:

            db.rollback()

            raise

    print(
        "\n--------------------------------------"
    )

    print(
        f"Inserted jobs: {inserted}"
    )

    print(
        f"Updated jobs: {updated}"
    )

    print(
        f"Total processed: "
        f"{inserted + updated}"
    )

    print(
        "--------------------------------------"
    )


# ============================================================
# MAIN
# ============================================================

def main():

    db = SessionLocal()

    try:

        print(
            "\n======================================"
        )

        print(
            "   SwipeX Excel Job Seeder"
        )

        print(
            "======================================\n"
        )

        # --------------------------------------------
        # STEP 1
        # --------------------------------------------

        close_old_demo_jobs(
            db
        )

        # --------------------------------------------
        # STEP 2
        # --------------------------------------------

        close_legacy_dataset_jobs(
            db
        )

        # --------------------------------------------
        # STEP 3
        # --------------------------------------------

        df = load_excel()

        # --------------------------------------------
        # STEP 4
        # --------------------------------------------

        prepared_jobs = prepare_jobs(
            df
        )

        # --------------------------------------------
        # STEP 5
        # --------------------------------------------

        company_cache = load_company_cache(
            db
        )

        # --------------------------------------------
        # STEP 6
        # --------------------------------------------

        insert_jobs(
            db,
            prepared_jobs,
            company_cache,
        )

        print(
            "\n======================================"
        )

        print(
            "Excel job seeding completed successfully."
        )

        print(
            "Actual dataset company names were preserved."
        )

        print(
            "======================================\n"
        )

    except Exception as e:

        db.rollback()

        print(
            "\n======================================"
        )

        print(
            "ERROR while seeding jobs:"
        )

        print(
            e
        )

        print(
            "======================================\n"
        )

        raise

    finally:

        db.close()


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()
