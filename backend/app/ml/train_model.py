import sys
from pathlib import Path

import joblib
import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import FeatureUnion
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, r2_score

from .preprocess import prepare_dataset


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[2]

MODEL_DIR = BASE_DIR / "app" / "ml" / "models"

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)

MODEL_PATH = MODEL_DIR / "job_match_model.pkl"


# =========================================================
# PREPARE TRAINING DATA
# =========================================================

def prepare_training_data():

    df = prepare_dataset()

    # -----------------------------------------------------
    # COMBINE RESUME + JOB INFORMATION
    # -----------------------------------------------------

    df["combined_text"] = (
        "resume: "
        + df["resume_text"].fillna("")
        + " job: "
        + df["job_text"].fillna("")
    )

    # -----------------------------------------------------
    # TARGET
    # -----------------------------------------------------

    y = pd.to_numeric(
        df["matched_score"],
        errors="coerce"
    )

    # -----------------------------------------------------
    # REMOVE INVALID ROWS
    # -----------------------------------------------------

    valid_rows = y.notna()

    df = df.loc[
        valid_rows
    ].copy()

    y = y.loc[
        valid_rows
    ]

    # -----------------------------------------------------
    # LIMIT SCORE TO 0-100
    # -----------------------------------------------------

    y = y.clip(
        lower=0,
        upper=100
    )

    X = df["combined_text"]

    return X, y


# =========================================================
# TRAIN MODEL
# =========================================================

def train_model():

    print(
        "\n========================================"
    )

    print(
        "SwipeX ML Job Matching Model"
    )

    print(
        "========================================\n"
    )

    # -----------------------------------------------------
    # LOAD DATA
    # -----------------------------------------------------

    X, y = prepare_training_data()

    print(
        f"Training records: {len(X)}"
    )

    # -----------------------------------------------------
    # TRAIN / TEST SPLIT
    # -----------------------------------------------------

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=0.20,
            random_state=42
        )
    )

    print(
        f"Training samples: {len(X_train)}"
    )

    print(
        f"Testing samples: {len(X_test)}"
    )

    # =====================================================
    # TF-IDF
    # =====================================================

    vectorizer = TfidfVectorizer(
        lowercase=True,
        stop_words="english",
        ngram_range=(1, 2),
        max_features=15000
    )

    # -----------------------------------------------------
    # TRANSFORM TEXT
    # -----------------------------------------------------

    X_train_vectorized = (
        vectorizer.fit_transform(
            X_train
        )
    )

    X_test_vectorized = (
        vectorizer.transform(
            X_test
        )
    )

    print(
        f"\nTF-IDF feature count: "
        f"{X_train_vectorized.shape[1]}"
    )

    # =====================================================
    # RIDGE REGRESSION MODEL
    # =====================================================

    model = Ridge(
        alpha=1.0
    )

    model.fit(
        X_train_vectorized,
        y_train
    )

    # =====================================================
    # PREDICTIONS
    # =====================================================

    predictions = model.predict(
        X_test_vectorized
    )

    # -----------------------------------------------------
    # KEEP PREDICTIONS BETWEEN 0 AND 100
    # -----------------------------------------------------

    predictions = predictions.clip(
        0,
        100
    )

    # =====================================================
    # EVALUATION
    # =====================================================

    mae = mean_absolute_error(
        y_test,
        predictions
    )

    r2 = r2_score(
        y_test,
        predictions
    )

    print(
        "\nModel Performance"
    )

    print(
        "-------------------------"
    )

    print(
        f"Mean Absolute Error: "
        f"{mae:.2f}"
    )

    print(
        f"R² Score: "
        f"{r2:.4f}"
    )

    # =====================================================
    # SAVE MODEL
    # =====================================================

    model_package = {
        "model": model,
        "vectorizer": vectorizer
    }

    joblib.dump(
        model_package,
        MODEL_PATH
    )

    print(
        "\nModel saved to:"
    )

    print(
        MODEL_PATH
    )

    print(
        "\n========================================"
    )

    print(
        "ML model training completed!"
    )

    print(
        "========================================"
    )


# =========================================================
# RUN
# =========================================================

if __name__ == "__main__":

    try:

        train_model()

    except Exception as error:

        print(
            "\nERROR DURING TRAINING:"
        )

        print(
            error
        )

        sys.exit(1)