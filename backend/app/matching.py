from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def calculate_job_match(resume_text: str, job_text: str) -> float:
    """
    Calculate similarity between a resume and a job
    using TF-IDF and cosine similarity.
    """

    if not resume_text or not job_text:
        return 0.0

    documents = [
        resume_text.lower(),
        job_text.lower()
    ]

    vectorizer = TfidfVectorizer(
        stop_words="english"
    )

    tfidf_matrix = vectorizer.fit_transform(documents)

    similarity = cosine_similarity(
        tfidf_matrix[0:1],
        tfidf_matrix[1:2]
    )[0][0]

    return round(float(similarity * 100), 2)