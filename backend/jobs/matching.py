"""
The ML matching model for job recommendations: a TF-IDF vectorizer trained
on every job's title + skills + description, used to rank jobs by how
similar they are to a resume's text (cosine similarity).

Train it with: python manage.py train_job_matcher
It must be retrained any time jobs are added/changed (e.g. after importing
the dataset) for new jobs to be included in ranking.
"""
from pathlib import Path

import joblib
from django.conf import settings
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .models import Job

MODEL_DIR = Path(settings.BASE_DIR) / "ml_models"
VECTORIZER_PATH = MODEL_DIR / "tfidf_vectorizer.joblib"
JOB_VECTORS_PATH = MODEL_DIR / "job_vectors.joblib"
JOB_IDS_PATH = MODEL_DIR / "job_ids.joblib"


def build_job_text(job):
    skills_text = " ".join(job.skills_required)
    return f"{job.title} {skills_text} {job.description}"


def train_matcher():
    jobs = list(Job.objects.all())
    if not jobs:
        raise ValueError("No jobs in the database to train on — import the dataset first.")

    texts = [build_job_text(job) for job in jobs]
    job_ids = [job.id for job in jobs]

    vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
    job_vectors = vectorizer.fit_transform(texts)

    MODEL_DIR.mkdir(exist_ok=True)
    joblib.dump(vectorizer, VECTORIZER_PATH)
    joblib.dump(job_vectors, JOB_VECTORS_PATH)
    joblib.dump(job_ids, JOB_IDS_PATH)

    return len(jobs)


def _load_model():
    if not VECTORIZER_PATH.exists():
        raise FileNotFoundError(
            "No trained matching model found. Run: python manage.py train_job_matcher"
        )
    vectorizer = joblib.load(VECTORIZER_PATH)
    job_vectors = joblib.load(JOB_VECTORS_PATH)
    job_ids = joblib.load(JOB_IDS_PATH)
    return vectorizer, job_vectors, job_ids


def rank_jobs_for_resume(resume_text, exclude_job_ids=None):
    vectorizer, job_vectors, job_ids = _load_model()
    exclude_job_ids = set(exclude_job_ids or [])

    resume_vector = vectorizer.transform([resume_text])
    similarities = cosine_similarity(resume_vector, job_vectors)[0]

    return {
        job_id: round(float(score) * 100, 1)
        for job_id, score in zip(job_ids, similarities)
        if job_id not in exclude_job_ids
    }