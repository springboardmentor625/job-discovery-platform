import os
import joblib
from django.conf import settings

POSSIBLE_MODEL_DIRS = [
    os.path.join(settings.BASE_DIR, "recommendation", "trained_model"),
    os.path.join(settings.BASE_DIR, "candidates", "recommendation", "trained_model"),
]


_CACHED_VECTORIZER = None
_CACHED_MODEL = None
_MODEL_LOAD_TRIED = False


def load_prediction_model():
    global _CACHED_VECTORIZER, _CACHED_MODEL, _MODEL_LOAD_TRIED
    if _MODEL_LOAD_TRIED:
        return _CACHED_VECTORIZER, _CACHED_MODEL

    _MODEL_LOAD_TRIED = True
    for model_dir in POSSIBLE_MODEL_DIRS:
        vectorizer_path = os.path.join(model_dir, "skill_vectorizer.pkl")
        model_path = os.path.join(model_dir, "recommendation_model.pkl")

        if (
            os.path.exists(vectorizer_path)
            and os.path.exists(model_path)
            and os.path.getsize(vectorizer_path) > 0
            and os.path.getsize(model_path) > 0
        ):
            try:
                _CACHED_VECTORIZER = joblib.load(vectorizer_path)
                _CACHED_MODEL = joblib.load(model_path)
                return _CACHED_VECTORIZER, _CACHED_MODEL
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
