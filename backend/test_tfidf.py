from app import app, Job, Resume
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


with app.app_context():

    # ============================================================
    # 1. GET JOBS
    # ============================================================

    jobs = Job.query.filter_by(status="active").all()

    print(f"Total jobs: {len(jobs)}")


    # ============================================================
    # 2. BUILD TEXT DOCUMENT FOR EACH JOB
    # ============================================================

    job_texts = []

    for job in jobs:

        # Get required skills
        skills = job.required_skills or []

        # required_skills is normally stored as a list
        if isinstance(skills, list):
            skills_text = " ".join(
                str(skill) for skill in skills
            )
        else:
            skills_text = str(skills)

        # Combine important job content
        text = " ".join([
            str(job.title or ""),
            str(job.description or ""),
            skills_text
        ])

        job_texts.append(text)


    # ============================================================
    # 3. CREATE AND FIT TF-IDF
    # ============================================================

    vectorizer = TfidfVectorizer(
        stop_words="english",
        max_features=20000
    )

    job_vectors = vectorizer.fit_transform(job_texts)

    print(
        f"TF-IDF matrix shape: {job_vectors.shape}"
    )


    # ============================================================
    # 4. GET REAL CANDIDATE
    # ============================================================

    resume = Resume.query.filter(
        Resume.extracted_skills.isnot(None)
    ).first()

    if resume is None:
        print("No resume with extracted skills found.")
        exit()


    print("\nREAL CANDIDATE")
    print("=" * 60)

    print(f"User ID: {resume.user_id}")
    print(f"Skills: {resume.extracted_skills}")


    # ============================================================
    # 5. CONVERT CANDIDATE SKILLS INTO TEXT
    # ============================================================

    candidate_skills = resume.extracted_skills or []

    if isinstance(candidate_skills, list):

        candidate_text = " ".join(
            str(skill) for skill in candidate_skills
        )

    else:

        candidate_text = str(candidate_skills)


    print(f"\nCandidate text:")
    print(candidate_text)


    # ============================================================
    # 6. CONVERT CANDIDATE INTO SAME TF-IDF SPACE
    # ============================================================

    candidate_vector = vectorizer.transform(
        [candidate_text]
    )


    # ============================================================
    # 7. CALCULATE COSINE SIMILARITY
    # ============================================================

    similarities = cosine_similarity(
        candidate_vector,
        job_vectors
    ).flatten()


    # ============================================================
    # 8. GET TOP 10 JOBS
    # ============================================================

    top_indices = similarities.argsort()[::-1][:10]


    print("\nTOP 10 TF-IDF RECOMMENDATIONS")
    print("=" * 60)


    for rank, index in enumerate(
        top_indices,
        start=1
    ):

        job = jobs[index]

        print(
            f"{rank}. "
            f"{job.title} | "
            f"Similarity: {similarities[index]:.4f}"
        )