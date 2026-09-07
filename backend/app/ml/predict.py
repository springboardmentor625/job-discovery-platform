import joblib
from pathlib import Path


# =========================================================
# MODEL PATH
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    BASE_DIR
    / "app"
    / "ml"
    / "models"
    / "job_match_model.pkl"
)


# =========================================================
# LOAD TRAINED MODEL
# =========================================================

model_package = joblib.load(
    MODEL_PATH
)

model = model_package["model"]
vectorizer = model_package["vectorizer"]


# =========================================================
# PREDICT JOB MATCH
# =========================================================

def predict_job_match(
    resume_text,
    job_text
):
    """
    Predict resume-job compatibility.

    The trained dataset stores matched_score
    between 0 and 1.

    Example:
        0.66 -> 66%
        0.85 -> 85%
    """

    resume_text = (
        resume_text
        or ""
    )

    job_text = (
        job_text
        or ""
    )

    # -----------------------------------------------------
    # COMBINE RESUME AND JOB TEXT
    # -----------------------------------------------------

    combined_text = (
        "resume: "
        + str(resume_text)
        + " job: "
        + str(job_text)
    )

    # -----------------------------------------------------
    # TF-IDF
    # -----------------------------------------------------

    features = vectorizer.transform(
        [combined_text]
    )

    # -----------------------------------------------------
    # ML PREDICTION
    # -----------------------------------------------------

    prediction = model.predict(
        features
    )[0]

    # -----------------------------------------------------
    # DATASET SCALE = 0 TO 1
    # -----------------------------------------------------

    prediction = max(
        0.0,
        min(
            1.0,
            float(prediction)
        )
    )

    # -----------------------------------------------------
    # CONVERT TO PERCENTAGE
    # -----------------------------------------------------

    percentage = (
        prediction * 100
    )

    return round(
        percentage,
        2
    )