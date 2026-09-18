FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip

RUN pip install --no-cache-dir -r requirements.txt

# resume_parser.py calls spacy.load("en_core_web_sm") for NER-based
# skill/section extraction. This was previously never downloaded during
# the image build, so every container silently fell back to the
# regex-only extraction path with no visible warning that the better
# NLP path was dead. `spacy` itself is installed via requirements.txt
# above; this fetches the actual language model it needs.
RUN python -m spacy download en_core_web_sm

# embeddings.py loads the "all-MiniLM-L6-v2" sentence-transformers model
# at import time; without pre-fetching it here, that load fails inside
# the container (no network access assumed at runtime) and every
# semantic-similarity call silently falls back to the word-overlap
# heuristic instead of real embeddings.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]