import os
import joblib

from django.conf import settings

from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression

from candidates.models import JobSwipe


def train_recommendation_model():

    swipes = (
        JobSwipe.objects
        .select_related("job")
        .exclude(
            job__required_skills__isnull=True
        )
    )

    if swipes.count() < 10:

        print(
            "Not enough swipe history to train the model."
        )

        return

    X = []
    y = []

    for swipe in swipes:

        skills = (
            swipe.job.required_skills
            or ""
        )

        skills = skills.lower().strip()

        if not skills:
            continue

        X.append(skills)

        y.append(
            1
            if swipe.decision == "right"
            else 0
        )

    # ==========================================
    # CHECK TRAINING DATA
    # ==========================================

    if len(X) < 10:

        print(
            "Not enough valid training data."
        )

        return

    # Need both classes
    if len(set(y)) < 2:

        print(
            "Need both left and right swipes "
            "to train LogisticRegression."
        )

        return

    # ==========================================
    # VECTORIZE
    # ==========================================

    vectorizer = CountVectorizer(
        lowercase=True
    )

    X_vectorized = (
        vectorizer.fit_transform(X)
    )

    # ==========================================
    # MODEL
    # ==========================================

    model = LogisticRegression(
        random_state=42,
        max_iter=1000
    )

    model.fit(
        X_vectorized,
        y
    )

    # ==========================================
    # SAVE
    # ==========================================

    model_dir = os.path.join(
        settings.BASE_DIR,
        "recommendation",
        "trained_model"
    )

    os.makedirs(
        model_dir,
        exist_ok=True
    )

    joblib.dump(
        vectorizer,
        os.path.join(
            model_dir,
            "skill_vectorizer.pkl"
        )
    )

    joblib.dump(
        model,
        os.path.join(
            model_dir,
            "recommendation_model.pkl"
        )
    )

    print(
        "Recommendation model trained successfully."
    )
