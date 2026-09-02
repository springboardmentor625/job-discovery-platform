import os
import joblib

from django.conf import settings

from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression

from candidates.models import JobSwipe


def train_recommendation_model():

    swipes = JobSwipe.objects.select_related("job")

    # Need enough data to train
    if swipes.count() < 10:
        print("Not enough swipe history to train the model.")
        return

    X = []
    y = []

    for swipe in swipes:

        X.append(
            swipe.job.required_skills.lower()
        )

        y.append(
            1 if swipe.decision == "right" else 0
        )

    vectorizer = CountVectorizer()

    X_vectorized = vectorizer.fit_transform(X)

    model = LogisticRegression(
        random_state=42,
        max_iter=1000
    )

    model.fit(X_vectorized, y)

    model_dir = os.path.join(
        settings.BASE_DIR,
        "candidates",
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

    print("Recommendation model trained successfully.")