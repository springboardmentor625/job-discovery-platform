import ast
import re
from pathlib import Path

import pandas as pd


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[2]

DATASET_PATH = (
    BASE_DIR
    / "datasets"
    / "resume_data_for_ranking.csv"
)


# =========================================================
# LOAD DATASET
# =========================================================

def load_dataset():
    """
    Load the Kaggle resume/job ranking dataset.
    """

    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found at: {DATASET_PATH}"
        )

    df = pd.read_csv(DATASET_PATH)

    return df


# =========================================================
# CLEAN TEXT
# =========================================================

def clean_text(value):
    """
    Convert a value into normalized text.
    """

    if pd.isna(value):
        return ""

    text = str(value)

    text = text.lower()

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    text = text.strip()

    return text


# =========================================================
# PARSE SKILLS
# =========================================================

def parse_skills(value):
    """
    Convert skills stored as a Python-list string
    into a normal list of skills.

    Example:

    "['Python', 'React', 'Docker']"

    becomes:

    ['python', 'react', 'docker']
    """

    if pd.isna(value):
        return []

    # -----------------------------------------------------
    # Already a list
    # -----------------------------------------------------

    if isinstance(value, list):

        return [
            clean_text(skill)
            for skill in value
            if clean_text(skill)
        ]

    value = str(value).strip()

    if not value:
        return []

    # -----------------------------------------------------
    # Try Python list format
    # -----------------------------------------------------

    try:

        parsed = ast.literal_eval(value)

        if isinstance(parsed, list):

            return [
                clean_text(skill)
                for skill in parsed
                if clean_text(skill)
            ]

    except (
        ValueError,
        SyntaxError,
    ):

        pass

    # -----------------------------------------------------
    # Handle comma/newline separated skills
    # -----------------------------------------------------

    value = value.replace(
        "\n",
        ","
    )

    skills = value.split(",")

    return [
        clean_text(skill)
        for skill in skills
        if clean_text(skill)
    ]


# =========================================================
# EXTRACT EXPERIENCE YEARS
# =========================================================

def extract_experience_years(value):
    """
    Extract the numeric experience requirement.

    Examples:

    'At least 3 years' -> 3

    'At least 1 year' -> 1

    '5 years' -> 5

    Missing/invalid -> 0
    """

    if pd.isna(value):

        return 0.0

    text = str(value).lower()

    match = re.search(
        r"(\d+(?:\.\d+)?)",
        text
    )

    if not match:

        return 0.0

    try:

        return float(
            match.group(1)
        )

    except ValueError:

        return 0.0


# =========================================================
# CREATE COMBINED RESUME TEXT
# =========================================================

def create_resume_text(row):
    """
    Combine important resume fields into one text field.
    """

    fields = [
        row.get(
            "career_objective",
            ""
        ),

        row.get(
            "skills",
            ""
        ),

        row.get(
            "degree_names",
            ""
        ),

        row.get(
            "major_field_of_studies",
            ""
        ),

        row.get(
            "professional_company_names",
            ""
        ),

        row.get(
            "positions",
            ""
        ),

        row.get(
            "responsibilities",
            ""
        ),

        row.get(
            "certification_skills",
            ""
        ),
    ]

    return " ".join(
        clean_text(field)
        for field in fields
        if clean_text(field)
    )


# =========================================================
# CREATE JOB TEXT
# =========================================================

def create_job_text(row):
    """
    Combine important job fields into one text field.
    """

    fields = [
        row.get(
            "job_position_name",
            ""
        ),

        row.get(
            "educationaL_requirements",
            ""
        ),

        row.get(
            "experiencere_requirement",
            ""
        ),

        row.get(
            "responsibilities.1",
            ""
        ),

        row.get(
            "skills_required",
            ""
        ),

        row.get(
            "related_skils_in_job",
            ""
        ),
    ]

    return " ".join(
        clean_text(field)
        for field in fields
        if clean_text(field)
    )


# =========================================================
# PREPARE DATASET
# =========================================================

def prepare_dataset():
    """
    Prepare the raw Kaggle dataset for ML training.
    """

    df = load_dataset()

    # -----------------------------------------------------
    # REQUIRED COLUMNS
    # -----------------------------------------------------

    required_columns = [
        "skills",
        "job_position_name",
        "experiencere_requirement",
        "skills_required",
        "matched_score",
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:

        raise ValueError(
            "Dataset is missing required columns: "
            + ", ".join(missing_columns)
        )

    # -----------------------------------------------------
    # RESUME SKILLS
    # -----------------------------------------------------

    df["resume_skills"] = (
        df["skills"]
        .apply(parse_skills)
    )

    # -----------------------------------------------------
    # JOB SKILLS
    # -----------------------------------------------------

    df["job_skills"] = (
        df["skills_required"]
        .apply(parse_skills)
    )

    # -----------------------------------------------------
    # EXPERIENCE
    # -----------------------------------------------------

    df["required_experience_years"] = (
        df[
            "experiencere_requirement"
        ]
        .apply(
            extract_experience_years
        )
    )

    # -----------------------------------------------------
    # RESUME TEXT
    # -----------------------------------------------------

    df["resume_text"] = (
        df.apply(
            create_resume_text,
            axis=1
        )
    )

    # -----------------------------------------------------
    # JOB TEXT
    # -----------------------------------------------------

    df["job_text"] = (
        df.apply(
            create_job_text,
            axis=1
        )
    )

    # -----------------------------------------------------
    # MATCHED SCORE
    # -----------------------------------------------------

    df["matched_score"] = pd.to_numeric(
        df["matched_score"],
        errors="coerce"
    )

    # -----------------------------------------------------
    # REMOVE INVALID TARGETS
    # -----------------------------------------------------

    df = df.dropna(
        subset=[
            "matched_score"
        ]
    )

    # -----------------------------------------------------
    # KEEP RELEVANT ML COLUMNS
    # -----------------------------------------------------

    processed_df = df[
        [
            "resume_skills",
            "job_skills",
            "resume_text",
            "job_text",
            "required_experience_years",
            "matched_score",
        ]
    ].copy()

    # -----------------------------------------------------
    # RESET INDEX
    # -----------------------------------------------------

    processed_df = (
        processed_df
        .reset_index(drop=True)
    )

    return processed_df


# =========================================================
# MAIN TEST
# =========================================================

if __name__ == "__main__":

    print(
        "\n========================================"
    )

    print(
        "SwipeX ML Dataset Preprocessing"
    )

    print(
        "========================================\n"
    )

    try:

        data = prepare_dataset()

        print(
            f"Dataset location:\n"
            f"{DATASET_PATH}\n"
        )

        print(
            f"Total records: {len(data)}"
        )

        print(
            f"Total processed columns: "
            f"{len(data.columns)}\n"
        )

        print(
            "Processed columns:"
        )

        for column in data.columns:

            print(
                f"  - {column}"
            )

        print(
            "\nMatched score statistics:"
        )

        print(
            data[
                "matched_score"
            ].describe()
        )

        print(
            "\nFirst processed record:"
        )

        print(
            data.iloc[0].to_dict()
        )

        print(
            "\n========================================"
        )

        print(
            "Preprocessing completed successfully!"
        )

        print(
            "========================================"
        )

    except Exception as error:

        print(
            "\nERROR:"
        )

        print(error)