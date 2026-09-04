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

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.database import SessionLocal
from app.models import CandidateProfile, Job, JobSwipe, Resume
from app.services.ats_service import guess_job_category
from app.services.resume_parser import normalize_skill, categorize_skills
from app.services.embeddings import semantic_similarity


MODEL_PATH = BACKEND_DIR / "app" / "ml_models" / "swipe_classifier.joblib"


def skills_to_set(raw_skills):
    if not raw_skills:
        return set()

    return {
        normalize_skill(skill)
        for skill in str(raw_skills).split(",")
        if skill.strip()
    }


def build_feature_vector(profile, resume, job):
    candidate_skills = (
        skills_to_set(profile.skills)
        |
        skills_to_set(resume.extracted_skills if resume else "")
    )
    job_skills = skills_to_set(job.skills)

    overlap_count = len(candidate_skills & job_skills)
    overlap_ratio = overlap_count / max(len(candidate_skills), 1)

    candidate_text = " ".join(
        part
        for part in [
            profile.headline,
            profile.bio,
            profile.preferred_role,
            profile.experience,
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

        if total < 30:
            print(
                f"Only {total} swipe rows found. "
                "At least 30 are required; no model was trained or saved."
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

            features.append(build_feature_vector(profile, resume, job))
            labels.append(label)

        if len(set(labels)) < 2:
            print(
                "Training stopped: swipe data contains only one class "
                "(all likes/right or all rejects/left). Both classes are "
                "required for LogisticRegression; no model was saved."
            )
            return

        model = LogisticRegression(
            max_iter=1000,
            random_state=42,
        )
        model.fit(features, labels)

        training_accuracy = model.score(features, labels)

        MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, MODEL_PATH)

        print("================================")
        print("SWIPE MODEL TRAINING COMPLETED")
        print("================================")
        print(f"Swipe rows used : {len(labels)}")
        print(f"Training accuracy: {training_accuracy:.4f}")
        print(f"Model saved     : {MODEL_PATH}")

    finally:
        db.close()


if __name__ == "__main__":
    train()
