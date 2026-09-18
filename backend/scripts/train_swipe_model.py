"""Train the SwipeX swipe-personalization classifier.

Run from backend/:
    python scripts/train_swipe_model.py

Job skills are read from the current jobs row because JobSwipe currently
stores no historical skill snapshot. This keeps training aligned with the
schema without changing any out-of-scope models.
"""

from pathlib import Path
import re
import sys

import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.database import SessionLocal  # type: ignore[import]
from app.models import CandidateProfile, Job, JobSwipe, Resume  # type: ignore[import]
from app.services.ats_service import guess_job_category  # type: ignore[import]
from app.services.skill_utils import categorize_skills, merge_skills, normalize_skills  # type: ignore[import]
from app.services.candidate_data import build_candidate_data  # type: ignore[import]
from app.services.embeddings import semantic_similarity  # type: ignore[import]


MODEL_PATH = BACKEND_DIR / "app" / "ml_models" / "swipe_classifier.joblib"


def build_feature_vector(profile, resume, job, candidate_data):
    candidate_skills = candidate_data.skills
    job_skills = normalize_skills(job.skills)

    overlap_count = len(candidate_skills & job_skills)
    overlap_ratio = overlap_count / max(len(candidate_skills), 1)

    candidate_text = " ".join(
        part
        for part in [
            profile.headline,
            profile.bio,
            profile.preferred_role,
            str(profile.experience_years)if profile.experience_years is not None else "",
            profile.education,
            resume.extracted_text if resume else "",
        ]
        if part
    )

    semantic_score = semantic_similarity(
        candidate_text,
        job.description or "",
    ) / 100

    candidate_categories = categorize_skills(
        ", ".join(candidate_skills)
    )
    job_categories = categorize_skills(job.skills or "")
    role_category_match = int(
        guess_job_category(
            profile.preferred_role or profile.headline,
            "",
        )
        == guess_job_category(job.title, job.description)
    )
    category = int(
        bool(candidate_categories & job_categories)
        or role_category_match
    )

    return [
        overlap_count,
        overlap_ratio,
        semantic_score,
        category,
    ]


def train():
    db = SessionLocal()

    try:
        swipes = (
            db.query(JobSwipe, CandidateProfile, Resume, Job)
            .join(
                CandidateProfile,
                CandidateProfile.user_id == JobSwipe.user_id,
            )
            .outerjoin(
                Resume,
                (Resume.user_id == JobSwipe.user_id)
                & (Resume.is_primary == True),
            )
            .join(
                Job,
                Job.job_id == JobSwipe.job_id,
            )
            .filter(
                JobSwipe.action.in_(["right", "like", "left", "reject"])
            )
            .all()
        )

        total = len(swipes)

        if total < 10:
            print(
                f"Only {total} swipe rows found. "
                "At least 10 are required; no model was trained or saved."
            )
            return

        features = []
        labels = []

        for swipe, profile, resume, job in swipes:
            action = swipe.action.lower()

            if action in {"right", "like"}:
                label = 1
            elif action in {"left", "reject"}:
                label = 0
            else:
                continue

            features.append(
                build_feature_vector(
                    profile,
                    resume,
                    job,
                    build_candidate_data(db, profile.user_id),
                )
            )
            labels.append(label)

        if len(set(labels)) < 2:
            print(
                "Training stopped: swipe data contains only one class "
                "(all likes/right or all rejects/left). Both classes are "
                "required for LogisticRegression; no model was saved."
            )
            return

        test_size = max(2, round(len(labels) * 0.2))
        can_stratify = min(labels.count(0), labels.count(1)) >= 2
        try:
            train_features, test_features, train_labels, test_labels = train_test_split(
                features,
                labels,
                test_size=test_size,
                random_state=42,
                stratify=labels if can_stratify else None,
            )
        except ValueError as split_error:
            print(f"Validation split unavailable: {split_error}")
            train_features = test_features = train_labels = test_labels = None

        model = LogisticRegression(
            max_iter=1000,
            random_state=42,
        )
        if train_features is not None and len(set(train_labels)) == 2:
            model.fit(train_features, train_labels)
            predictions = model.predict(test_features)
            metrics = {
                "accuracy": accuracy_score(test_labels, predictions),
                "precision": precision_score(test_labels, predictions, zero_division=0),
                "recall": recall_score(test_labels, predictions, zero_division=0),
                "f1": f1_score(test_labels, predictions, zero_division=0),
            }
        else:
            metrics = None

        # Refit the saved model on all available historical rows after the
        # held-out evaluation; the reported metrics remain test-set metrics.
        model.fit(features, labels)

        MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, MODEL_PATH)

        print("================================")
        print("SWIPE MODEL TRAINING COMPLETED")
        print("================================")
        print(f"Swipe rows used : {len(labels)}")
        if metrics:
            print(f"Test accuracy   : {metrics['accuracy']:.4f}")
            print(f"Test precision  : {metrics['precision']:.4f}")
            print(f"Test recall     : {metrics['recall']:.4f}")
            print(f"Test F1         : {metrics['f1']:.4f}")
        else:
            print("Test metrics    : unavailable (insufficient split data)")
        print(f"Model saved     : {MODEL_PATH}")

    finally:
        db.close()


if __name__ == "__main__":
    train()
