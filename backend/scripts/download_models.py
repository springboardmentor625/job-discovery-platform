# scripts/download_models.py
import subprocess
import sys
import spacy
from sentence_transformers import SentenceTransformer

from app.utils.logger import swipex_logger
from app.core.config import settings

def cache_ai_models():
    swipex_logger.info("Initializing AI Model Cache sequence...")

    # 1. Cache the HuggingFace Vector Model
    swipex_logger.info(f"Checking Vector Model: {settings.EMBEDDING_MODEL_NAME}...")
    # Just calling this initializes the download if it's missing, or loads from cache if it exists
    SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
    swipex_logger.success(f"[{settings.EMBEDDING_MODEL_NAME}] is cached and ready.")

    # 2. Cache the spaCy NLP Model
    spacy_model = "en_core_web_sm"
    swipex_logger.info(f"Checking NLP Model: {spacy_model}...")
    try:
        spacy.load(spacy_model)
        swipex_logger.success(f"[{spacy_model}] is already installed.")
    except OSError:
        swipex_logger.warning(f"[{spacy_model}] not found. Downloading from spacy...")
        # Programmatically run the terminal command to download the model
        subprocess.check_call([sys.executable, "-m", "spacy", "download", spacy_model])
        swipex_logger.success(f"[{spacy_model}] successfully downloaded and cached.")

    swipex_logger.success("All ML pipelines are fully cached. Ready for production traffic.")

if __name__ == "__main__":
    cache_ai_models()