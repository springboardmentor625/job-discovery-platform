from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_DIR = BASE_DIR / "ml"

_vectorizer = None
_model = None
_models_loaded = False


def _ensure_models():
    global _vectorizer, _model, _models_loaded
    if not _models_loaded:
        try:
            import joblib
            v_path = MODEL_DIR / "vectorizer.pkl"
            m_path = MODEL_DIR / "naive_bayes.pkl"
            if v_path.exists() and m_path.exists():
                _vectorizer = joblib.load(v_path)
                _model = joblib.load(m_path)
        except Exception:
            pass
        _models_loaded = True
    return _vectorizer, _model


def predict_resume_score(resume_text):
    vectorizer, model = _ensure_models()
    if not model or not vectorizer:
        # Graceful heuristic fallback based on text content
        if not resume_text:
            return 50.0
        words = len(str(resume_text).split())
        return float(min(95.0, max(45.0, round(50.0 + min(40.0, words / 15.0), 2))))

    try:
        X = vectorizer.transform([str(resume_text or "")])
        probability = model.predict_proba(X)[0][1]
        return round(float(probability * 100), 2)
    except Exception:
        return 75.0