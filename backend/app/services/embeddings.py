import math
import re

# ==========================================
# EMBEDDINGS SERVICE
#
# Loads the sentence-transformers model once at
# import time. If the package (or its model
# weights) isn't available in this environment,
# EMBEDDINGS_AVAILABLE is set to False and every
# caller falls back to the word-overlap heuristic
# instead of crashing — see recommendation_routes
# .compute_semantic_match() and ats_service
# .semantic_similarity_score() for the fallback
# paths.
# ==========================================

EMBEDDINGS_AVAILABLE = False
_model = None

try:
    from sentence_transformers import SentenceTransformer

    _model = SentenceTransformer("all-MiniLM-L6-v2")
    EMBEDDINGS_AVAILABLE = True

except Exception as import_error:  # noqa: BLE001

    print(
        "[embeddings] sentence-transformers unavailable "
        f"({import_error}) — falling back to word-overlap "
        "similarity everywhere semantic_match is used."
    )


def get_embedding(text):
    """
    Returns a list[float] embedding for the given text,
    or None if the embedding model isn't available.
    """

    if not EMBEDDINGS_AVAILABLE or not text:
        return None

    return _model.encode(text).tolist()


def cosine_similarity(vec_a, vec_b):
    """
    Cosine similarity between two equal-length vectors,
    scaled to a 0-100 range (matching the rest of the
    scoring code, which works in 0-100 percentages).
    """

    if not vec_a or not vec_b:
        return 0.0

    dot = sum(a * b for a, b in zip(vec_a, vec_b))

    magnitude_a = math.sqrt(sum(a * a for a in vec_a))
    magnitude_b = math.sqrt(sum(b * b for b in vec_b))

    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0

    similarity = dot / (magnitude_a * magnitude_b)

    # Cosine similarity is -1..1; clamp to 0..1 then scale to 0..100
    similarity = max(0.0, min(1.0, similarity))

    return round(similarity * 100, 2)


# ==========================================
# JOB EMBEDDING CACHE
# Avoids recomputing the same job's embedding
# on every request that scores it.
# ==========================================

_job_embedding_cache = {}


def get_cached_job_embedding(job_id, description):

    if job_id in _job_embedding_cache:
        return _job_embedding_cache[job_id]

    embedding = get_embedding(description)
    _job_embedding_cache[job_id] = embedding

    return embedding


def get_cached_text_embedding(text: str):
    """Return a cached embedding for arbitrary text, reusing the shared embedding model."""
    if not text or not text.strip():
        return None
    return get_text_embedding(text)

def semantic_similarity(text_a, text_b):
    """Return semantic similarity as a 0-100 score using the loaded embedding model."""
    if not text_a or not text_b:
        return 0.0

    embedding_a = get_cached_text_embedding(text_a)
    embedding_b = get_cached_text_embedding(text_b)

    if embedding_a and embedding_b:
        return cosine_similarity(embedding_a, embedding_b)

    # Graceful fallback when sentence-transformers is unavailable.
    stopwords = {
        "the", "and", "for", "with", "you", "are", "our", "will",
        "have", "has", "this", "that", "your", "from", "job", "role",
        "work", "team", "who", "can", "able", "not", "all", "any",
        "into", "out", "per", "such", "than", "then", "them", "they",
        "about", "also", "using", "use", "years", "year", "experience",
    }

    words_a = {
        word for word in re.findall(r"[a-zA-Z]{3,}", text_a.lower())
        if word not in stopwords
    }
    words_b = {
        word for word in re.findall(r"[a-zA-Z]{3,}", text_b.lower())
        if word not in stopwords
    }

    if not words_a or not words_b:
        return 0.0

    return round(min(len(words_a & words_b) / len(words_b) * 100, 100), 2)
