import os
import joblib
from django.conf import settings

POSSIBLE_MODEL_DIRS = [
    os.path.join(settings.BASE_DIR, "recommendation", "trained_model"),
    os.path.join(settings.BASE_DIR, "candidates", "recommendation", "trained_model"),
]


def load_prediction_model():
    for model_dir in POSSIBLE_MODEL_DIRS:
        vectorizer_path = os.path.join(model_dir, "skill_vectorizer.pkl")
        model_path = os.path.join(model_dir, "recommendation_model.pkl")

        if os.path.exists(vectorizer_path) and os.path.exists(model_path):
            try:
                vectorizer = joblib.load(vectorizer_path)
                model = joblib.load(model_path)
                return vectorizer, model
            except Exception:
                pass
    return None, None


def predict_job_match_probability(job_skills_text):
    if not job_skills_text:
        return 50.0

    vectorizer, model = load_prediction_model()
    if not vectorizer or not model:
        return 50.0

    try:
        X = vectorizer.transform([str(job_skills_text).lower()])
        classes = list(model.classes_)
        if 1 in classes:
            idx = classes.index(1)
            prob = model.predict_proba(X)[0][idx]
            return round(float(prob * 100), 2)
    except Exception:
        pass

    return 50.0
