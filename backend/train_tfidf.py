from app import app, Job
from tfidf_model import build_tfidf


with app.app_context():

    jobs = Job.query.filter_by(status="active").all()

    if not jobs:
        print("No active jobs found.")
        exit(1)

    build_tfidf(jobs)

    print("TF-IDF training completed successfully.")