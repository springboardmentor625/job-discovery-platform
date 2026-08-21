import os

test_db_path = "./test_swipex.db"
if os.path.exists(test_db_path):
    try:
        os.remove(test_db_path)
    except Exception:
        pass

os.environ["DATABASE_URL"] = f"sqlite:///{test_db_path}"
os.environ["JWT_SECRET"] = "test-secret"

from fastapi.testclient import TestClient
from app.main import app, startup, engine, Base

client = TestClient(app)

# Reset DB schema and seed initial data for clean test run
Base.metadata.drop_all(engine)
startup()


def token(email: str, password: str) -> str:
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]


def test_health():
    assert client.get("/health").json()["status"] == "ok"


def test_seeker_can_list_jobs_and_apply():
    access_token = token("candidate@swipex.dev", "candidate123")
    headers = {"Authorization": f"Bearer {access_token}"}
    jobs = client.get("/api/jobs", headers=headers)
    assert jobs.status_code == 200
    assert len(jobs.json()) > 0
    job_id = jobs.json()[0]["id"]
    applied = client.post("/api/swipes", headers=headers, json={"job_id": job_id, "decision": "right"})
    assert applied.status_code == 200
    applications = client.get("/api/applications", headers=headers)
    assert applications.status_code == 200
    assert applications.json()[0]["job_id"] == job_id


def test_recruiter_can_review_candidates():
    access_token = token("hr@swipex.dev", "recruiter123")
    headers = {"Authorization": f"Bearer {access_token}"}
    candidates = client.get("/api/recruiter/candidates", headers=headers)
    assert candidates.status_code == 200
    assert isinstance(candidates.json(), list)


def test_admin_can_monitor_activity():
    access_token = token("admin@swipex.dev", "admin12345")
    headers = {"Authorization": f"Bearer {access_token}"}
    overview = client.get("/api/admin/overview", headers=headers)
    activity = client.get("/api/admin/activity", headers=headers)
    assert overview.status_code == 200
    assert activity.status_code == 200
    assert "users" in overview.json()


def test_resume_parsing_flow():
    access_token = token("candidate@swipex.dev", "candidate123")
    headers = {"Authorization": f"Bearer {access_token}"}
    sample_resume = "John Doe\nEmail: john@example.com\nExperience: 3 years in Software Engineering\nSkills: React, Python, SQL, Docker\nEducation: Bachelor of Technology in CS"
    response = client.post(
        "/api/resumes/analyze",
        headers=headers,
        files={"file": ("resume.txt", sample_resume.encode("utf-8"), "text/plain")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "extracted_skills" in data
    assert "React" in data["extracted_skills"] or "python" in [s.lower() for s in data["extracted_skills"]]
    assert data["experience_years"] == 3.0
    assert len(data["education"]) > 0


def test_ai_recommendation_engine_and_swipe_feedback():
    access_token = token("candidate@swipex.dev", "candidate123")
    headers = {"Authorization": f"Bearer {access_token}"}
    
    jobs_response = client.get("/api/jobs", headers=headers)
    assert jobs_response.status_code == 200
    jobs = jobs_response.json()
    assert len(jobs) > 0
    first_job = jobs[0]
    assert "match_score" in first_job
    assert isinstance(first_job["match_score"], (int, float))

    # Swipe right on job
    swipe_res = client.post("/api/swipes", headers=headers, json={"job_id": first_job["id"], "decision": "right"})
    assert swipe_res.status_code == 200
    
    # Verify swiped job is excluded from active recommendations feed
    updated_jobs = client.get("/api/jobs", headers=headers).json()
    swiped_ids = [j["id"] for j in updated_jobs]
    assert first_job["id"] not in swiped_ids


def test_ats_workflow_execution():
    recruiter_token = token("hr@swipex.dev", "recruiter123")
    recruiter_headers = {"Authorization": f"Bearer {recruiter_token}"}
    job_res = client.post("/api/jobs", headers=recruiter_headers, json={
        "title": "Fullstack Python Developer",
        "company": "SwipeX Core",
        "location": "Remote",
        "job_type": "Full-time",
        "skills": ["Python", "FastAPI", "React", "SQL"],
        "description": "Looking for a skilled Python developer to build intelligent ATS workflows and AI engines."
    })
    assert job_res.status_code == 201
    job_id = job_res.json()["id"]

    candidate_token = token("candidate@swipex.dev", "candidate123")
    candidate_headers = {"Authorization": f"Bearer {candidate_token}"}

    # Trigger ATS workflow
    response = client.post("/api/ats-workflow/run", headers=candidate_headers, json={"job_id": job_id})
    assert response.status_code == 200
    report = response.json()
    
    assert "ats_score" in report
    assert "workflow_steps" in report
    assert len(report["workflow_steps"]) >= 9
    step_titles = [step["title"] for step in report["workflow_steps"]]
    assert "Apply for Job" in step_titles
    assert "Retrieve Resume" in step_titles
    assert "Retrieve Job Description" in step_titles
    assert "Extract Skills & Keywords" in step_titles
    assert "Compare Resume with Job Description" in step_titles
    assert "Calculate ATS Score" in step_titles
    assert "Identify Missing Skills" in step_titles
    assert "Generate Improvement Suggestions" in step_titles
    assert "Store ATS Report" in step_titles
    assert "End" in step_titles


