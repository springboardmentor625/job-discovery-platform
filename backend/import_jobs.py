import os
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values


# ============================================================
# CONFIGURATION
# ============================================================

# Dataset is mounted by docker-compose.yml:
# ./dataset:/app/dataset:ro

DATASET_PATH = "/app/dataset/indian-job-market-dataset-2025.xlsx"

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/SwipeX"
)


# ============================================================
# HELPERS
# ============================================================

def clean_value(value):
    """Convert pandas NaN/empty values to None."""

    if pd.isna(value):
        return None

    if isinstance(value, str):
        value = value.strip()

        if not value:
            return None

    return value


def clean_integer(value):
    """Convert numeric values to integers or None."""

    value = clean_value(value)

    if value is None:
        return None

    try:
        return int(float(value))

    except (ValueError, TypeError):
        return None


def clean_job_id(value):
    """Convert job ID to integer."""

    try:
        return int(value)

    except (ValueError, TypeError):
        return None


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 60)
    print("SwipeX - Job Dataset Importer")
    print("=" * 60)

    # --------------------------------------------------------
    # CHECK DATASET
    # --------------------------------------------------------

    if not os.path.exists(DATASET_PATH):

        print("\nERROR: Dataset not found:")
        print(DATASET_PATH)

        return

    print("\nDataset found:")
    print(DATASET_PATH)

    # --------------------------------------------------------
    # READ EXCEL
    # --------------------------------------------------------

    print("\nReading dataset...")

    try:
        df = pd.read_excel(DATASET_PATH)

    except Exception as e:

        print("\nERROR: Could not read Excel file.")
        print(e)

        return

    print(f"Rows found: {len(df)}")

    # --------------------------------------------------------
    # REQUIRED COLUMNS
    # --------------------------------------------------------

    required_columns = [
        "title",
        "jobId",
        "companyName",
        "tagsAndSkills",
        "location",
        "companyId",
        "jobDescription",
        "minimumSalary",
        "maximumSalary",
        "minimumExperience",
        "maximumExperience",
        "jobUploaded",
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:

        print("\nERROR: Missing columns:")

        for column in missing_columns:
            print(f" - {column}")

        return

    # --------------------------------------------------------
    # SELECT REQUIRED COLUMNS
    # --------------------------------------------------------

    df = df[required_columns].copy()

    # --------------------------------------------------------
    # REMOVE INVALID ROWS
    # --------------------------------------------------------

    df = df.dropna(
        subset=[
            "jobId",
            "companyId",
            "companyName",
            "title"
        ]
    )

    # --------------------------------------------------------
    # REMOVE DUPLICATE JOBS
    # --------------------------------------------------------

    df = df.drop_duplicates(
        subset=["jobId"]
    )

    print(f"Rows after cleaning: {len(df)}")

    # --------------------------------------------------------
    # CONNECT TO POSTGRESQL
    # --------------------------------------------------------

    print("\nConnecting to PostgreSQL...")

    try:

        conn = psycopg2.connect(
            DATABASE_URL
        )

        cur = conn.cursor()

        print("Connected successfully!")

    except Exception as e:

        print("\nERROR: Could not connect to PostgreSQL.")
        print(e)

        return

    try:

        # ====================================================
        # COMPANIES
        # ====================================================

        print("\nPreparing companies...")

        companies = {}

        for _, row in df.iterrows():

            company_id = clean_integer(
                row["companyId"]
            )

            company_name = clean_value(
                row["companyName"]
            )

            if company_id is None:
                continue

            if company_name is None:
                continue

            if company_id not in companies:

                companies[company_id] = company_name

        company_values = [
            (
                company_id,
                company_name
            )

            for company_id, company_name
            in companies.items()
        ]

        print(
            f"Unique companies: {len(company_values)}"
        )

        if company_values:

            execute_values(
                cur,

                """
                INSERT INTO companies (
                    company_id,
                    company_name
                )
                VALUES %s

                ON CONFLICT (company_id)
                DO UPDATE SET
                    company_name =
                        EXCLUDED.company_name
                """,

                company_values,

                page_size=1000
            )

        print(
            "Companies imported successfully!"
        )

        # ====================================================
        # JOBS
        # ====================================================

        print("\nPreparing jobs...")

        jobs = []

        for _, row in df.iterrows():

            job_id = clean_job_id(
                row["jobId"]
            )

            company_id = clean_integer(
                row["companyId"]
            )

            title = clean_value(
                row["title"]
            )

            description = clean_value(
                row["jobDescription"]
            )

            location = clean_value(
                row["location"]
            )

            required_skills = clean_value(
                row["tagsAndSkills"]
            )

            salary_min = clean_integer(
                row["minimumSalary"]
            )

            salary_max = clean_integer(
                row["maximumSalary"]
            )

            min_exp = clean_value(
                row["minimumExperience"]
            )

            max_exp = clean_value(
                row["maximumExperience"]
            )

            # ------------------------------------------------
            # EXPERIENCE
            # ------------------------------------------------

            experience_required = None

            if (
                min_exp is not None
                and max_exp is not None
            ):

                try:

                    min_exp = float(min_exp)
                    max_exp = float(max_exp)

                    if min_exp.is_integer():
                        min_exp = int(min_exp)

                    if max_exp.is_integer():
                        max_exp = int(max_exp)

                    experience_required = (
                        f"{min_exp}-{max_exp} years"
                    )

                except (
                    ValueError,
                    TypeError
                ):

                    experience_required = None

            elif min_exp is not None:

                try:

                    min_exp = float(min_exp)

                    if min_exp.is_integer():
                        min_exp = int(min_exp)

                    experience_required = (
                        f"{min_exp}+ years"
                    )

                except (
                    ValueError,
                    TypeError
                ):

                    experience_required = None

            # ------------------------------------------------
            # SKIP INVALID JOB
            # ------------------------------------------------

            if (
                job_id is None
                or company_id is None
                or title is None
            ):

                continue

            # ------------------------------------------------
            # ADD JOB
            # ------------------------------------------------

            jobs.append(
                (
                    job_id,
                    company_id,
                    title,
                    description,
                    location,

                    # Dataset doesn't provide
                    # reliable employment type.
                    None,

                    salary_min,
                    salary_max,
                    experience_required,
                    required_skills,

                    # jobUploaded contains values such
                    # as "6 Days Ago", so don't insert
                    # it into DATE automatically.
                    None,

                    "active"
                )
            )

        print(
            f"Valid jobs prepared: {len(jobs)}"
        )

        # ====================================================
        # INSERT JOBS
        # ====================================================

        print(
            "\nImporting jobs into PostgreSQL..."
        )

        execute_values(
            cur,

            """
            INSERT INTO jobs (
                job_id,
                company_id,
                title,
                description,
                location,
                employment_type,
                salary_min,
                salary_max,
                experience_required,
                required_skills,
                posted_date,
                status
            )
            VALUES %s

            ON CONFLICT (job_id)
            DO UPDATE SET

                company_id =
                    EXCLUDED.company_id,

                title =
                    EXCLUDED.title,

                description =
                    EXCLUDED.description,

                location =
                    EXCLUDED.location,

                salary_min =
                    EXCLUDED.salary_min,

                salary_max =
                    EXCLUDED.salary_max,

                experience_required =
                    EXCLUDED.experience_required,

                required_skills =
                    EXCLUDED.required_skills,

                status =
                    EXCLUDED.status
            """,

            jobs,

            page_size=1000
        )

        print(
            "Jobs imported successfully!"
        )

        # ====================================================
        # COMMIT
        # ====================================================

        conn.commit()

        print("\n" + "=" * 60)
        print(
            "DATASET IMPORT COMPLETED SUCCESSFULLY!"
        )
        print("=" * 60)

        print(
            f"\nCompanies imported: "
            f"{len(company_values)}"
        )

        print(
            f"Jobs imported: "
            f"{len(jobs)}"
        )

    except Exception as e:

        print("\nERROR DURING IMPORT:")
        print(e)

        print(
            "\nRolling back changes..."
        )

        conn.rollback()

    finally:

        cur.close()
        conn.close()

        print(
            "\nPostgreSQL connection closed."
        )


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()