import json
import joblib

from app import app, db, SwipeHistory, Resume, CandidateProfile, Job

from recommendation import (
    calculate_skill_match,
    calculate_location_match,
    calculate_job_type_match
)

from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score


MODEL_PATH = "trained_model.pkl"


def parse_skills(value):
    """Convert stored JSON skill text into a Python list."""

    if not value:
        return []

    try:
        skills = json.loads(value)

        if isinstance(skills, list):
            return skills

    except (json.JSONDecodeError, TypeError):
        pass

    return []


def create_training_data():

    X = []
    y = []

    swipes = SwipeHistory.query.filter(
        SwipeHistory.swipe_action.in_(["LEFT", "RIGHT"])
    ).order_by(
        SwipeHistory.swiped_at
    ).all()

    print(f"Total swipes: {len(swipes)}")

    for swipe in swipes:

        # ----------------------------------------
        # Get candidate profile
        # ----------------------------------------

        profile = CandidateProfile.query.filter_by(
            user_id=swipe.user_id
        ).first()

        if not profile:
            continue

        # ----------------------------------------
        # Get default resume
        # ----------------------------------------

        resume = Resume.query.filter_by(
            user_id=swipe.user_id,
            is_default=True
        ).first()

        if not resume:
            continue

        # ----------------------------------------
        # Get job
        # ----------------------------------------

        job = db.session.get(Job, swipe.job_id)

        if not job:
            continue

        # ----------------------------------------
        # Candidate skills
        # ----------------------------------------

        candidate_skills = parse_skills(
            resume.extracted_skills
        )

        # ----------------------------------------
        # Job skills
        # ----------------------------------------

        job_skills = parse_skills(
            job.required_skills
        )

        # ----------------------------------------
        # Feature 1: Skill Match
        # ----------------------------------------

        skill_match = calculate_skill_match(
            candidate_skills,
            job_skills
        )

        # ----------------------------------------
        # Feature 2: Location Match
        # ----------------------------------------

        location_match = calculate_location_match(
            profile.preferred_location,
            job.location
        )

        # ----------------------------------------
        # Feature 3: Job Type Match
        # ----------------------------------------

        job_type_match = calculate_job_type_match(
            profile.preferred_job_type,
            job.employment_type
        )

        # ----------------------------------------
        # Add features
        # ----------------------------------------

        X.append([
            skill_match,
            location_match,
            job_type_match
        ])

        # ----------------------------------------
        # Labels
        #
        # RIGHT = 1
        # LEFT  = 0
        # ----------------------------------------

        if swipe.swipe_action == "RIGHT":
            y.append(1)
        else:
            y.append(0)

    return X, y


def train_model(X, y):

    # ----------------------------------------
    # Check minimum data
    # ----------------------------------------

    if len(X) < 10:
        print(
            f"Not enough training data: {len(X)}"
        )
        return None

    # ----------------------------------------
    # Need both classes
    # ----------------------------------------

    if len(set(y)) < 2:
        print(
            "Need both LEFT and RIGHT examples"
        )
        return None

    # ----------------------------------------
    # Logistic Regression Pipeline
    # ----------------------------------------

    model = Pipeline([
        (
            "scaler",
            StandardScaler()
        ),
        (
            "classifier",
            LogisticRegression(
                max_iter=1000
            )
        )
    ])

    # ----------------------------------------
    # Train model
    # ----------------------------------------

    model.fit(X, y)

    # ----------------------------------------
    # Training accuracy
    # ----------------------------------------

    predictions = model.predict(X)

    accuracy = accuracy_score(
        y,
        predictions
    )

    # ----------------------------------------
    # Print results
    # ----------------------------------------

    print()
    print("=" * 50)
    print("MODEL TRAINING COMPLETE")
    print("=" * 50)

    print(f"Training samples : {len(X)}")
    print(f"LEFT samples     : {y.count(0)}")
    print(f"RIGHT samples    : {y.count(1)}")

    print(
        f"Training accuracy: {accuracy * 100:.2f}%"
    )

    print()
    print("Features:")
    print("1. Skill Match")
    print("2. Location Match")
    print("3. Job Type Match")

    # ----------------------------------------
    # Model coefficients
    # ----------------------------------------

    classifier = model.named_steps["classifier"]

    print()
    print("Logistic Regression coefficients:")

    print(
        classifier.coef_
    )

    print()
    print("Intercept:")

    print(
        classifier.intercept_
    )

    return model


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    with app.app_context():

        # ----------------------------------------
        # Create training dataset
        # ----------------------------------------

        X, y = create_training_data()

        print()
        print(
            f"Usable training rows: {len(X)}"
        )

        # ----------------------------------------
        # Train model
        # ----------------------------------------

        model = train_model(X, y)

        # ----------------------------------------
        # Save trained model
        # ----------------------------------------

        if model:

            joblib.dump(
                model,
                MODEL_PATH
            )

            print()
            print(
                f"ML: Model saved to {MODEL_PATH}"
            )