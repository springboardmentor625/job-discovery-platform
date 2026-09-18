"""
Advanced Hybrid ML Job Recommender.
Combines Dense Vector Embeddings (MiniLM-L6-v2), N-gram TF-IDF, and Skill Overlap
to rank jobs and identify the single top match to the candidate's resume.
"""
from typing import List, Optional, Sequence
import re

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.core.models import CandidateProfile, Job, Resume
from app.services.ai.embedder import vector_engine
from app.services.ai.matcher import analyze_ats_match


def _skills_text(skills) -> str:
    if not skills:
        return ""
    if isinstance(skills, list):
        return " ".join(str(s) for s in skills if s)
    return str(skills)


def _job_document(job: Job) -> str:
    return " ".join(
        part for part in (
            f"{job.title} {job.title}",  # Double title weight
            _skills_text(job.required_skills),
            job.description or "",
        )
        if part
    ).strip()


def find_top_resume_match(
    candidate_skills: List[str],
    resume_text: str,
    job: Job
) -> Optional[str]:
    """Finds strictly the single top matching skill or highlight from the candidate's resume/profile for this job."""
    job_title_lower = (job.title or "").lower()
    job_desc_lower = (job.description or "").lower()
    job_skills_lower = {str(s).strip().lower() for s in (job.required_skills or []) if str(s).strip()}

    scored_matches = []
    
    # 1. Match from explicit skills
    for skill in candidate_skills:
        s_clean = str(skill).strip()
        if not s_clean:
            continue
        s_lower = s_clean.lower()
        score = 0
        
        # Skill in job title (critical role match!)
        if re.search(r'\b' + re.escape(s_lower) + r'\b', job_title_lower):
            score += 25
        elif s_lower in job_title_lower:
            score += 15

        # Exact skill in job required skills
        if s_lower in job_skills_lower:
            score += 20
        elif any(s_lower in js or js in s_lower for js in job_skills_lower):
            score += 10

        # Skill in job description
        if re.search(r'\b' + re.escape(s_lower) + r'\b', job_desc_lower):
            score += 6
        elif s_lower in job_desc_lower:
            score += 3

        if score > 0:
            scored_matches.append((s_clean, score))

    # Sort strictly by highest score descending
    scored_matches.sort(key=lambda x: x[1], reverse=True)
    
    if scored_matches:
        # Strictly return the single top item
        return scored_matches[0][0]

    # 2. Check if any job required skills appear in resume text
    if resume_text:
        matched_job_skills = []
        for req_skill in (job.required_skills or []):
            rs_clean = str(req_skill).strip()
            if rs_clean:
                rs_lower = rs_clean.lower()
                m_score = 0
                if re.search(r'\b' + re.escape(rs_lower) + r'\b', resume_text.lower()):
                    m_score = 10
                    if re.search(r'\b' + re.escape(rs_lower) + r'\b', job_title_lower):
                        m_score += 15
                    matched_job_skills.append((rs_clean, m_score))
        
        if matched_job_skills:
            matched_job_skills.sort(key=lambda x: x[1], reverse=True)
            return matched_job_skills[0][0]

    return None


def rank_jobs_for_candidate(
    profile: Optional[CandidateProfile],
    jobs: Sequence[Job],
    resume: Optional[Resume] = None,
    top_k: int = 20,
) -> List[Job]:
    """
    Ranks active jobs using the exact ATS matcher and dense vector similarities.
    Attaches exact ATS match_score and single top_resume_match to each Job instance.
    Returns only the top matching jobs for the candidate's profile.
    """
    job_list = list(jobs)
    if not job_list:
        return []

    candidate_skills = profile.skills if (profile and profile.skills) else []
    resume_raw = resume.raw_text if (resume and resume.raw_text) else ""
    candidate_bio = profile.about_bio if (profile and profile.about_bio) else ""
    candidate_vector = resume.embedding if (resume and resume.embedding is not None) else None

    # Generate candidate vector if missing but text exists
    if candidate_vector is None and (resume_raw or candidate_bio):
        try:
            candidate_vector = vector_engine.get_embedding(resume_raw or candidate_bio)
        except Exception:
            candidate_vector = None

    # Synthesize rich candidate representation for n-gram TF-IDF
    candidate_parts = []
    if candidate_skills:
        candidate_parts.append(" ".join(candidate_skills) * 3)
    if candidate_bio:
        candidate_parts.append(candidate_bio)
    if resume_raw:
        candidate_parts.append(resume_raw[:3000])

    candidate_doc = " ".join(candidate_parts).strip()
    has_profile_data = bool(candidate_skills or resume_raw or candidate_bio)

    # 1. Compute TF-IDF similarities across corpus
    tfidf_scores = [0.0] * len(job_list)
    if candidate_doc:
        corpus = [_job_document(j) or "job position" for j in job_list] + [candidate_doc]
        try:
            vectorizer = TfidfVectorizer(
                stop_words="english",
                max_features=10000,
                ngram_range=(1, 2),
                sublinear_tf=True
            )
            matrix = vectorizer.fit_transform(corpus)
            cand_vec = matrix[-1]
            jobs_vecs = matrix[:-1]
            tfidf_scores = cosine_similarity(cand_vec, jobs_vecs).flatten().tolist()
        except Exception:
            tfidf_scores = [0.0] * len(job_list)

    # 2. Compute Exact ATS Score & Single Top Resume Match for each job
    scored_jobs = []
    for idx, job in enumerate(job_list):
        tfidf_sim = float(tfidf_scores[idx]) if idx < len(tfidf_scores) else 0.0

        # Ensure job vector exists for cosine similarity
        if job.embedding is None and job.description:
            try:
                job.embedding = vector_engine.get_embedding(job.description)
            except Exception:
                pass

        # Execute official ATS match analysis - guaranteed 1:1 match with Tracking History!
        if has_profile_data:
            ats_report = analyze_ats_match(
                candidate_skills=candidate_skills,
                job_skills=job.required_skills or [],
                candidate_vector=candidate_vector,
                job_vector=job.embedding
            )
            exact_ats_score = float(ats_report["ats_score"])
        else:
            exact_ats_score = 50.0

        # Extract strictly the single top match to the resume
        top_match = find_top_resume_match(candidate_skills, resume_raw, job)

        # Attach to Job instance
        job.match_score = exact_ats_score
        job.top_resume_match = top_match

        # Ranking score blends ATS precision with secondary TF-IDF contextual boost
        rank_score = (exact_ats_score / 100.0) * 0.80 + (tfidf_sim * 0.20)

        scored_jobs.append((job, rank_score))

    # Sort strictly descending by ML rank score
    scored_jobs.sort(key=lambda x: x[1], reverse=True)

    # Return only the top matching jobs for the candidate's profile
    top_jobs = [job for job, _score in scored_jobs[:top_k]]
    return top_jobs
