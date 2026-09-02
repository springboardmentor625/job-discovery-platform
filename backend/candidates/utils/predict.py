import joblib
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]

MODEL_DIR = BASE_DIR / "ml"

vectorizer = joblib.load(MODEL_DIR / "vectorizer.pkl")
model = joblib.load(MODEL_DIR / "naive_bayes.pkl")


def predict_resume_score(resume_text):
    X = vectorizer.transform([resume_text])
    probability = model.predict_proba(X)[0][1]
    return round(probability * 100, 2)