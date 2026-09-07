'''import ast
import os
import re
import pandas as pd
from datetime import datetime

from app.database import SessionLocal
from app.models import Company, Job


# ============================================================
# CONFIGURATION
# ============================================================

CSV_PATH = "data/resume_data_for_ranking.csv"

# Supports the uploaded filename as well if that is the file
# you have placed inside your project's data folder.
ALTERNATE_CSV_PATH = "data/resume_data_for_ranking(3).csv"

CANONICAL_COMPANY_NAME = "SwipeX Job Dataset"

# Old importer used this company name.
# Jobs belonging to this company are closed so that they do
# not continue appearing in recommendations.
LEGACY_COMPANY_NAMES = [
    "SwipeX Dataset Jobs"
]


# ============================================================
# TEXT CLEANING
# ============================================================

def clean_text(value):
    """
    Convert a value into clean text.

    Existing behavior is preserved:
    - NaN/None -> ""
    - whitespace is normalized
    - surrounding whitespace is removed
    """

    if value is None:
        return ""

    if pd.isna(value):
        return ""

    text = str(value).strip()

    if not text:
        return ""

    text = re.sub(r"\s+", " ", text)

    return text.strip()


# ============================================================
# SKILL HELPERS
# ============================================================

def is_valid_skill(skill):
    """
    Decide whether a value looks like an actual skill rather
    than a long responsibility/job-description sentence.

    This is important because the dataset sometimes stores
    responsibility-style sentences inside skills_required.
    """

    skill = clean_text(skill)

    if not skill:
        return False

    # Reject extremely long sentence-like values.
    if len(skill) > 100:
        return False

    words = skill.split()

    # Reject very long sentence-like values.
    if len(words) > 12:
        return False

    # Reject obvious sentence patterns.
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
    ]

    lowered = skill.lower()

    for pattern in sentence_patterns:
        if re.search(pattern, lowered):
            return False

    # Reject values that look like complete sentences.
    if skill.endswith(".") and len(words) >= 5:
        return False

    return True


def flatten_skill_value(value):
    """
    Flatten nested Python/list-like values into a simple list.

    Handles:
    - ['Python', 'React']
    - [['Python', 'React'], ['FastAPI']]
    - string representations of lists
    - comma/newline/semicolon separated strings
    """

    if value is None:
        return []

    if isinstance(value, float) and pd.isna(value):
        return []

    # Already a list/tuple/set.
    if isinstance(value, (list, tuple, set)):
        result = []

        for item in value:
            result.extend(flatten_skill_value(item))

        return result

    text = str(value).strip()

    if not text:
        return []

    # Try Python literal format:
    # "['Python', 'React']"
    # "[['Python', 'React'], ['FastAPI']]"
    try:
        parsed = ast.literal_eval(text)

        if isinstance(parsed, (list, tuple, set)):
            return flatten_skill_value(parsed)

    except (ValueError, SyntaxError):
        pass

    # Normal text format.
    parts = re.split(r"[\n,;|]+", text)

    return [
        part.strip()
        for part in parts
        if part.strip()
    ]


def parse_skills(value):
    """
    Parse skills from a CSV field.

    Only skill-like values are retained.

    This prevents long responsibility sentences from being
    stored as required_skills in PostgreSQL.
    """

    raw_skills = flatten_skill_value(value)

    cleaned_skills = []

    seen = set()

    for skill in raw_skills:

        skill = clean_text(skill)

        if not skill:
            continue

        if not is_valid_skill(skill):
            continue

        # Remove trailing punctuation.
        skill = skill.strip(" .,:;")

        if not skill:
            continue

        normalized = skill.lower()

        if normalized in seen:
            continue

        seen.add(normalized)

        cleaned_skills.append(skill)

    return cleaned_skills


# ============================================================
# EXPERIENCE
# ============================================================

def extract_experience(value):
    """
    Extract a numeric experience value from values such as:

    - At least 4 years
    - At least 5 year(s)
    - 1 to 3 years
    - 2 to 5 years
    """

    text = clean_text(value)

    if not text:
        return 0

    numbers = re.findall(r"\d+(?:\.\d+)?", text)

    if not numbers:
        return 0

    try:
        # For ranges such as 1 to 3 years,
        # use the minimum experience.
        return int(float(numbers[0]))
    except (ValueError, TypeError):
        return 0


# ============================================================
# DESCRIPTION
# ============================================================

def create_description(row):
    """
    Create a useful job description from the available
    dataset columns.

    Existing functionality is preserved.
    """

    sections = []

    education = clean_text(
        row.get("educationaL_requirements", "")
    )

    experience = clean_text(
        row.get("experiencere_requirement", "")
    )

    responsibilities = clean_text(
        row.get("responsibilities.1", "")
    )

    related_skills = parse_skills(
        row.get("related_skils_in_job", "")
    )

    if education:
        sections.append(
            f"Education Requirements: {education}"
        )

    if experience:
        sections.append(
            f"Experience Requirements: {experience}"
        )

    if responsibilities:
        sections.append(
            f"Responsibilities: {responsibilities}"
        )

    if related_skills:
        sections.append(
            "Related Skills: "
            + ", ".join(related_skills)
        )

    if not sections:
        return "Job opportunity available through SwipeX."

    return "\n\n".join(sections)


# ============================================================
# SKILL QUALITY
# ============================================================

def get_best_skills(row):
    """
    Select the best available skill source.

    Priority:
    1. Clean skills_required
    2. related_skils_in_job

    This fixes the situation where skills_required contains
    responsibility sentences instead of actual skills.
    """

    primary_skills = parse_skills(
        row.get("skills_required", "")
    )

    related_skills = parse_skills(
        row.get("related_skils_in_job", "")
    )

    # If skills_required contains usable skills, use them.
    if primary_skills:
        return primary_skills

    # Otherwise use related job skills.
    if related_skills:
        return related_skills

    return []


def skill_quality_score(row):
    """
    Calculate how useful the row is for job creation.

    Rows containing actual atomic skills are preferred over
    rows containing empty or sentence-like skill fields.
    """

    skills = get_best_skills(row)

    score = len(skills)

    # Prefer rows that have actual skills_required.
    primary_skills = parse_skills(
        row.get("skills_required", "")
    )

    if primary_skills:
        score += 20

    return score


# ============================================================
# CLOSE OLD DEMO JOBS
# ============================================================

def close_old_demo_jobs(db):
    """
    Close the original demo jobs.

    Existing behavior is preserved.
    """

    old_job_ids = [1, 2, 3]

    jobs = (
        db.query(Job)
        .filter(Job.job_id.in_(old_job_ids))
        .all()
    )

    for job in jobs:
        job.status = "CLOSED"

    db.commit()

    print(
        f"Closed {len(jobs)} old demo job(s)."
    )


# ============================================================
# CLOSE LEGACY IMPORTER JOBS
# ============================================================

def close_legacy_dataset_jobs(db):
    """
    Close jobs created by the old import_csv_jobs.py script.

    The old script used:
        SwipeX Dataset Jobs

    The new canonical seed script uses:
        SwipeX Job Dataset

    We close the old jobs instead of deleting them so existing
    applications, swipes, and ATS reports are not unnecessarily
    disturbed.
    """

    legacy_companies = (
        db.query(Company)
        .filter(
            Company.company_name.in_(LEGACY_COMPANY_NAMES)
        )
        .all()
    )

    if not legacy_companies:
        print("No legacy dataset company found.")
        return

    total_closed = 0

    for company in legacy_companies:

        legacy_jobs = (
            db.query(Job)
            .filter(
                Job.company_id == company.company_id,
                Job.status == "ACTIVE"
            )
            .all()
        )

        for job in legacy_jobs:
            job.status = "CLOSED"
            total_closed += 1

    db.commit()

    print(
        f"Closed {total_closed} legacy dataset job(s)."
    )


# ============================================================
# GET / CREATE COMPANY
# ============================================================

def get_or_create_company(db):
    """
    Get the canonical SwipeX dataset company.

    Creates it only if it does not already exist.
    """

    company = (
        db.query(Company)
        .filter(
            Company.company_name == CANONICAL_COMPANY_NAME
        )
        .first()
    )

    if company:
        return company

    company = Company(
        company_name=CANONICAL_COMPANY_NAME
    )

    db.add(company)
    db.commit()
    db.refresh(company)

    print(
        f"Created company: {CANONICAL_COMPANY_NAME}"
    )

    return company


# ============================================================
# LOAD CSV
# ============================================================

def load_csv():
    """
    Load the SwipeX dataset.

    Supports both:
        data/resume_data_for_ranking.csv

    and:
        data/resume_data_for_ranking(3).csv
    """

    csv_path = CSV_PATH

    if not os.path.exists(csv_path):

        if os.path.exists(ALTERNATE_CSV_PATH):
            csv_path = ALTERNATE_CSV_PATH

        else:
            raise FileNotFoundError(
                "CSV dataset not found.\n"
                f"Tried:\n"
                f"  {CSV_PATH}\n"
                f"  {ALTERNATE_CSV_PATH}"
            )

    print(f"Loading CSV: {csv_path}")

    df = pd.read_csv(
        csv_path,
        low_memory=False
    )

    print(
        f"Loaded {len(df)} CSV rows."
    )

    return df


# ============================================================
# PREPARE REPRESENTATIVE JOBS
# ============================================================

def prepare_jobs(df):
    """
    Prepare one representative row for each unique job title.

    Existing functionality:
    - fill missing values
    - calculate completeness
    - select one row per job title

    Improvement:
    - rows with actual usable skills are preferred
    - rows containing long responsibility sentences in
      skills_required are not preferred
    """

    required_columns = [
        "job_position_name",
        "educationaL_requirements",
        "experiencere_requirement",
        "responsibilities.1",
        "skills_required",
        "related_skils_in_job"
    ]

    for column in required_columns:

        if column not in df.columns:
            df[column] = ""

    # Replace NaN with empty strings.
    df = df.fillna("")

    # Clean job title.
    df["job_position_name"] = (
        df["job_position_name"]
        .apply(clean_text)
    )

    # Remove rows without job title.
    df = df[
        df["job_position_name"] != ""
    ].copy()

    # Calculate useful information.
    df["_skills"] = df.apply(
        get_best_skills,
        axis=1
    )

    df["_skill_quality"] = df.apply(
        skill_quality_score,
        axis=1
    )

    # Existing completeness concept.
    completeness_columns = [
        "educationaL_requirements",
        "experiencere_requirement",
        "responsibilities.1",
        "skills_required",
        "related_skils_in_job"
    ]

    df["_completeness"] = (
        df[completeness_columns]
        .apply(
            lambda row: sum(
                1
                for value in row
                if clean_text(value)
            ),
            axis=1
        )
    )

    # Prefer:
    # 1. actual usable skills
    # 2. complete job information
    # 3. stable first occurrence
    df["_original_order"] = range(len(df))

    df = df.sort_values(
        by=[
            "_skill_quality",
            "_completeness",
            "_original_order"
        ],
        ascending=[
            False,
            False,
            True
        ]
    )

    # One representative row per job title.
    representative_rows = (
        df.drop_duplicates(
            subset=["job_position_name"],
            keep="first"
        )
        .copy()
    )

    print(
        f"Prepared {len(representative_rows)} unique job title(s)."
    )

    return representative_rows


# ============================================================
# INSERT / UPDATE JOBS
# ============================================================

def insert_jobs(db, df, company):
    """
    Insert or update jobs in PostgreSQL.

    Existing jobs matching:
        company + title

    are updated instead of creating duplicates.
    """

    inserted = 0
    updated = 0

    for _, row in df.iterrows():

        title = clean_text(
            row.get("job_position_name", "")
        )

        if not title:
            continue

        # ----------------------------------------------------
        # Skills
        # ----------------------------------------------------

        required_skills = get_best_skills(row)

        # ----------------------------------------------------
        # Description
        # ----------------------------------------------------

        description = create_description(row)

        # ----------------------------------------------------
        # Location
        # ----------------------------------------------------

        location = clean_text(
            row.get("locations", "")
        )

        if not location:
            location = clean_text(
                row.get("address", "")
            )

        # ----------------------------------------------------
        # Experience
        # ----------------------------------------------------

        experience_required = extract_experience(
            row.get("experiencere_requirement", "")
        )

        # ----------------------------------------------------
        # Employment type
        # ----------------------------------------------------

        employment_type = "FULL_TIME"

        # ----------------------------------------------------
        # Salary
        # ----------------------------------------------------

        salary_min = None
        salary_max = None

        # ----------------------------------------------------
        # Existing job
        # ----------------------------------------------------

        existing_job = (
            db.query(Job)
            .filter(
                Job.company_id == company.company_id,
                Job.title == title
            )
            .first()
        )

        if existing_job:

            existing_job.description = description
            existing_job.location = location
            existing_job.employment_type = employment_type
            existing_job.salary_min = salary_min
            existing_job.salary_max = salary_max
            existing_job.experience_required = (
                experience_required
            )
            existing_job.required_skills = (
                required_skills
            )
            existing_job.status = "ACTIVE"

            updated += 1

        else:

            new_job = Job(
                company_id=company.company_id,
                title=title,
                description=description,
                location=location,
                employment_type=employment_type,
                salary_min=salary_min,
                salary_max=salary_max,
                experience_required=experience_required,
                required_skills=required_skills,
                posted_date=datetime.utcnow(),
                status="ACTIVE"
            )

            db.add(new_job)

            inserted += 1

    db.commit()

    print(
        f"Inserted jobs: {inserted}"
    )

    print(
        f"Updated jobs: {updated}"
    )

    print(
        f"Total processed: {inserted + updated}"
    )


# ============================================================
# MAIN
# ============================================================

def main():

    db = SessionLocal()

    try:

        print("\n======================================")
        print("      SwipeX CSV Job Seeder")
        print("======================================\n")

        # ----------------------------------------------------
        # 1. Close old demo jobs
        # ----------------------------------------------------

        close_old_demo_jobs(db)

        # ----------------------------------------------------
        # 2. Close jobs created by old importer
        # ----------------------------------------------------

        close_legacy_dataset_jobs(db)

        # ----------------------------------------------------
        # 3. Load CSV
        # ----------------------------------------------------

        df = load_csv()

        # ----------------------------------------------------
        # 4. Prepare representative jobs
        # ----------------------------------------------------

        prepared_jobs = prepare_jobs(df)

        # ----------------------------------------------------
        # 5. Get/create canonical company
        # ----------------------------------------------------

        company = get_or_create_company(db)

        # ----------------------------------------------------
        # 6. Insert/update jobs
        # ----------------------------------------------------

        insert_jobs(
            db,
            prepared_jobs,
            company
        )

        print(
            "\n======================================"
        )

        print(
            "CSV job seeding completed successfully."
        )

        print(
            "======================================\n"
        )

    except Exception as e:

        db.rollback()

        print(
            "\nERROR while seeding jobs:"
        )

        print(e)

        raise

    finally:

        db.close()


if __name__ == "__main__":
    main()
'''
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

CANONICAL_COMPANY_NAME = "SwipeX Job Dataset"

LEGACY_COMPANY_NAMES = [
    "SwipeX Dataset Jobs"
]

# Database VARCHAR limits
MAX_TITLE_LENGTH = 150
MAX_LOCATION_LENGTH = 150

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

    This prevents:
        psycopg2.errors.StringDataRightTruncation
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

    The new dataset provides skills through tagsAndSkills,
    so we mainly remove empty values and obvious sentence-like
    values.
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
            result.extend(flatten_skill_value(item))

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

            if isinstance(parsed, (list, tuple, set)):
                return flatten_skill_value(parsed)

        except (ValueError, SyntaxError):
            pass

    # Split skill lists
    parts = re.split(r"[\n,;|]+", text)

    return [
        part.strip()
        for part in parts
        if part.strip()
    ]


def parse_skills(value):
    """
    Clean and deduplicate skills.
    """

    raw_skills = flatten_skill_value(value)

    cleaned_skills = []

    seen = set()

    for skill in raw_skills:

        skill = clean_text(skill)

        if not skill:
            continue

        if not is_valid_skill(skill):
            continue

        # Remove unwanted punctuation around the skill
        skill = skill.strip(" .,:;")

        if not skill:
            continue

        normalized = skill.lower()

        if normalized in seen:
            continue

        seen.add(normalized)

        cleaned_skills.append(skill)

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
        return int(float(numbers[0]))

    except (ValueError, TypeError):
        return 0


# ============================================================
# DESCRIPTION
# ============================================================

def create_description(row):
    """
    Use the dataset's actual jobDescription field.

    We intentionally DO NOT extract required skills from the
    description.

    Skills come only from tagsAndSkills.
    """

    description = clean_text(
        row.get("jobDescription", "")
    )

    if description:
        return description

    # Fallback description
    title = clean_text(
        row.get("title", "")
    )

    if title:
        return f"Job opportunity for {title}."

    return "Job opportunity available through SwipeX."


# ============================================================
# REQUIRED SKILLS
# ============================================================

def get_required_skills(row):
    """
    Extract required skills ONLY from tagsAndSkills.

    This is important because the previous dataset caused
    responsibilities and sentence-like text to become skills.
    """

    skills = parse_skills(
        row.get("tagsAndSkills", "")
    )

    return skills


# ============================================================
# SKILL QUALITY
# ============================================================

def skill_quality_score(row):
    """
    Score a row based on the quality/number of skills.

    Rows containing more valid skills are preferred when
    selecting one representative row for each job title.
    """

    skills = get_required_skills(row)

    return len(skills)


# ============================================================
# CLOSE OLD DEMO JOBS
# ============================================================

def close_old_demo_jobs(db):
    """
    Close the original demo jobs.
    """

    old_job_ids = [1, 2, 3]

    jobs = (
        db.query(Job)
        .filter(Job.job_id.in_(old_job_ids))
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

    legacy_companies = (
        db.query(Company)
        .filter(
            Company.company_name.in_(
                LEGACY_COMPANY_NAMES
            )
        )
        .all()
    )

    if not legacy_companies:
        print(
            "No legacy dataset company found."
        )
        return

    total_closed = 0

    for company in legacy_companies:

        legacy_jobs = (
            db.query(Job)
            .filter(
                Job.company_id == company.company_id,
                Job.status == "ACTIVE"
            )
            .all()
        )

        for job in legacy_jobs:

            job.status = "CLOSED"

            total_closed += 1

    db.commit()

    print(
        f"Closed {total_closed} legacy dataset job(s)."
    )


# ============================================================
# COMPANY
# ============================================================

def get_or_create_company(db):
    """
    Get or create the company used for dataset jobs.
    """

    company = (
        db.query(Company)
        .filter(
            Company.company_name
            == CANONICAL_COMPANY_NAME
        )
        .first()
    )

    if company:
        return company

    company = Company(
        company_name=CANONICAL_COMPANY_NAME
    )

    db.add(company)

    db.commit()

    db.refresh(company)

    print(
        f"Created company: {CANONICAL_COMPANY_NAME}"
    )

    return company


# ============================================================
# LOAD EXCEL DATASET
# ============================================================

def load_excel():
    """
    Load the Indian Job Market Excel dataset.
    """

    if not os.path.exists(EXCEL_PATH):

        raise FileNotFoundError(
            "\nIndian Job Market dataset not found.\n"
            f"Expected file:\n  {EXCEL_PATH}\n"
        )

    print(
        f"Loading Excel dataset: {EXCEL_PATH}"
    )

    df = pd.read_excel(
        EXCEL_PATH,
        engine="openpyxl"
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
    df["title"] = df["title"].apply(
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
        axis=1
    )

    # Skill quality
    df["_skill_quality"] = df[
        "_skills"
    ].apply(len)

    # Completeness
    completeness_columns = [
        "jobDescription",
        "experience",
        "location",
        "tagsAndSkills",
        "minimumSalary",
        "maximumSalary",
    ]

    df["_completeness"] = df[
        completeness_columns
    ].apply(
        lambda row: sum(
            1
            for value in row
            if clean_text(value)
        ),
        axis=1
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
            subset=["title"],
            keep="first"
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
        len(representative_rows)
        - valid_skill_count
    )

    print(
        f"Prepared "
        f"{len(representative_rows)} "
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

    except (TypeError, ValueError):
        pass

    text = str(value).strip()

    if not text:
        return None

    # Remove commas and currency symbols
    text = text.replace(",", "")

    match = re.search(
        r"\d+(?:\.\d+)?",
        text
    )

    if not match:
        return None

    try:
        return float(
            match.group()
        )

    except (ValueError, TypeError):
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

    except (TypeError, ValueError):
        pass

    try:

        parsed = pd.to_datetime(
            value,
            errors="coerce"
        )

        if pd.isna(parsed):
            return datetime.now(
                timezone.utc
            )

        # Convert pandas Timestamp to Python datetime
        result = parsed.to_pydatetime()

        # PostgreSQL can accept timezone-aware
        # datetime when using timestamptz.
        return result

    except Exception:

        return datetime.now(
            timezone.utc
        )


# ============================================================
# INSERT / UPDATE JOBS
# ============================================================

def insert_jobs(db, df, company):
    """
    Insert or update jobs.

    Uses batch commits to avoid creating one enormous
    PostgreSQL INSERT transaction.
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
        start=1
    ):

        # ----------------------------------------------------
        # TITLE
        # ----------------------------------------------------

        original_title = clean_text(
            row.get("title", "")
        )

        if not original_title:
            continue

        # IMPORTANT:
        # Job.title is VARCHAR(150) in the current schema.
        # Therefore safely limit it before insertion.
        title = clean_db_text(
            original_title,
            MAX_TITLE_LENGTH
        )

        if not title:
            continue

        # ----------------------------------------------------
        # LOCATION
        # ----------------------------------------------------

        location = clean_db_text(
            row.get("location", ""),
            MAX_LOCATION_LENGTH
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

        experience_required = extract_experience(
            row.get("experience", "")
        )

        # If minimumExperience exists,
        # prefer it because it is numeric.
        minimum_experience = extract_experience(
            row.get("minimumExperience", "")
        )

        if minimum_experience > 0:
            experience_required = (
                minimum_experience
            )

        # ----------------------------------------------------
        # SALARY
        # ----------------------------------------------------

        salary_min = extract_salary(
            row.get("minimumSalary", "")
        )

        salary_max = extract_salary(
            row.get("maximumSalary", "")
        )

        # ----------------------------------------------------
        # DATE
        # ----------------------------------------------------

        posted_date = extract_posted_date(
            row.get("jobUploaded", "")
        )

        # ----------------------------------------------------
        # EMPLOYMENT TYPE
        # ----------------------------------------------------

        employment_type = "FULL_TIME"

        # ----------------------------------------------------
        # FIND EXISTING JOB
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
                company_id=company.company_id,

                title=title,

                description=description,

                location=location,

                employment_type=employment_type,

                salary_min=salary_min,

                salary_max=salary_max,

                experience_required=(
                    experience_required
                ),

                required_skills=(
                    required_skills
                ),

                posted_date=posted_date,

                status="ACTIVE",
            )

            db.add(new_job)

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

        company = get_or_create_company(
            db
        )

        # --------------------------------------------
        # STEP 6
        # --------------------------------------------

        insert_jobs(
            db,
            prepared_jobs,
            company
        )

        print(
            "\n======================================"
        )

        print(
            "Excel job seeding completed successfully."
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