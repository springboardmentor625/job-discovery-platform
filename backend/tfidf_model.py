import json
import os
import pickle

from flask import Flask
from sklearn.feature_extraction.text import TfidfVectorizer


# ============================================================
# CONFIGURATION
# ============================================================

MODEL_DIR = "/app/model"

VECTORIZER_PATH = os.path.join(
    MODEL_DIR,
    "tfidf_vectorizer.pkl"
)

JOB_VECTORS_PATH = os.path.join(
    MODEL_DIR,
    "tfidf_job_vectors.pkl"
)

JOB_IDS_PATH = os.path.join(
    MODEL_DIR,
    "tfidf_job_ids.pkl"
)


# ============================================================
# BUILD JOB TEXT
# ============================================================

def build_job_text(job):
    """
    Convert one Job object into the text used by TF-IDF.

    We intentionally use only:
        - title
        - description
        - required_skills

    Location, salary, experience, etc. are handled separately.
    """

    skills = job.required_skills or []

    # required_skills may be stored as JSON text
    if isinstance(skills, str):

        try:
            skills = json.loads(skills)
        except (json.JSONDecodeError, TypeError):
            skills = [skills]

    if isinstance(skills, list):

        skills_text = " ".join(
            str(skill) for skill in skills
        )

    else:

        skills_text = str(skills)

    return " ".join([
        str(job.title or ""),
        str(job.description or ""),
        skills_text
    ])


# ============================================================
# TRAIN / BUILD TF-IDF
# ============================================================

def build_tfidf(jobs):

    print(f"Building TF-IDF for {len(jobs)} jobs...")

    job_texts = [
        build_job_text(job)
        for job in jobs
    ]

    vectorizer = TfidfVectorizer(
        stop_words="english",
        max_features=20000
    )

    job_vectors = vectorizer.fit_transform(
        job_texts
    )

    job_ids = [
        job.job_id
        for job in jobs
    ]

    # Make sure the model directory exists
    os.makedirs(
        MODEL_DIR,
        exist_ok=True
    )

    # Save vectorizer
    with open(
        VECTORIZER_PATH,
        "wb"
    ) as f:

        pickle.dump(
            vectorizer,
            f
        )

    # Save sparse TF-IDF job matrix
    with open(
        JOB_VECTORS_PATH,
        "wb"
    ) as f:

        pickle.dump(
            job_vectors,
            f
        )

    # Save job IDs in exactly the same order
    with open(
        JOB_IDS_PATH,
        "wb"
    ) as f:

        pickle.dump(
            job_ids,
            f
        )

    print(
        f"TF-IDF matrix shape: {job_vectors.shape}"
    )

    print(
        f"Vectorizer saved to: {VECTORIZER_PATH}"
    )

    print(
        f"Job vectors saved to: {JOB_VECTORS_PATH}"
    )

    print(
        f"Job IDs saved to: {JOB_IDS_PATH}"
    )

    return vectorizer, job_vectors, job_ids


# ============================================================
# LOAD TF-IDF
# ============================================================

def load_tfidf():

    if not (
        os.path.exists(VECTORIZER_PATH)
        and
        os.path.exists(JOB_VECTORS_PATH)
        and
        os.path.exists(JOB_IDS_PATH)
    ):
        return None

    with open(
        VECTORIZER_PATH,
        "rb"
    ) as f:

        vectorizer = pickle.load(f)

    with open(
        JOB_VECTORS_PATH,
        "rb"
    ) as f:

        job_vectors = pickle.load(f)

    with open(
        JOB_IDS_PATH,
        "rb"
    ) as f:

        job_ids = pickle.load(f)

    print(
        f"TF-IDF model loaded: {job_vectors.shape}"
    )

    return (
        vectorizer,
        job_vectors,
        job_ids
    )