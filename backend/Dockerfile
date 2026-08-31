FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY import_jobs.py .
COPY recommendation.py .
COPY skill_extractor.py .
COPY build_skill_vocabulary.py .
COPY migrate_required_skills.py .

RUN mkdir -p uploads

EXPOSE 5000

CMD ["python", "app.py"]
