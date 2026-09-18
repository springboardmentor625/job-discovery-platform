from typing import List, Optional
import numpy as np
from app.core.config import settings


class EmbeddingEngine:
    """Optional ATS helper. Job feed ranking does not depend on this."""

    _instance = None
    _model = None
    _failed = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingEngine, cls).__new__(cls)
        return cls._instance

    def _ensure_model(self):
        if self._model is not None or self._failed:
            return self._model
        try:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
        except Exception:
            self._failed = True
            self._model = None
        return self._model

    def get_embedding(self, text: str) -> Optional[List[float]]:
        if not text or not text.strip():
            return [0.0] * settings.EMBEDDING_DIMENSION
        model = self._ensure_model()
        if model is None:
            return None
        vector = model.encode(text)
        return vector.tolist()

    @staticmethod
    def calculate_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        if vec1 is None or vec2 is None or len(vec1) == 0 or len(vec2) == 0:
            return 0.0
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        dot_product = np.dot(v1, v2)
        norm_v1 = np.linalg.norm(v1)
        norm_v2 = np.linalg.norm(v2)
        if norm_v1 == 0 or norm_v2 == 0:
            return 0.0
        sim = dot_product / (norm_v1 * norm_v2)
        return float(max(0.0, min(1.0, (sim + 1.0) / 2.0)))


vector_engine = EmbeddingEngine()
