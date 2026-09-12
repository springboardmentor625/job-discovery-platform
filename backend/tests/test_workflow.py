"""
Automated tests covering the core candidate workflow end to end.
Run with: pytest
"""
import io

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from applications.models import Application
from jobs.models import Job
from resumes.models import Resume
from resumes.parsing import extract_skills
from swipes.models import Swipe

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def job_seeker(db):
    return User.objects.create_user(
        username="jane", email="jane@example.com", password="testpass123",
        role=User.Role.JOB_SEEKER,
    )


@pytest.fixture
def recruiter(db):
    return User.objects.create_user(
        username="recruiter", email="recruiter@example.com", password="testpass123",
        role=User.Role.RECRUITER,
    )


@pytest.fixture
def sample_job(recruiter):
    return Job.objects.create(
        recruiter=recruiter,
        title="Frontend Developer",
        company="Acme Corp",
        company_type=Job.CompanyType.STARTUP,
        description="Build React interfaces for our product team.",
        job_type=Job.JobType.FULL_TIME,
        experience_level=Job.ExperienceLevel.MID,
        location="Remote",
        skills_required=["react", "javascript", "css"],
    )


@pytest.mark.django_db
def test_register_creates_user_with_job_seeker_role(api_client):
    response = api_client.post("/api/auth/register/", {
        "username": "newuser", "email": "newuser@example.com",
        "password": "testpass123", "role": "job_seeker",
    })
    assert response.status_code == 201
    assert User.objects.filter(email="newuser@example.com").exists()


@pytest.mark.django_db
def test_login_returns_jwt_tokens(api_client, job_seeker):
    response = api_client.post("/api/auth/login/", {
        "email": "jane@example.com", "password": "testpass123",
    })
    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data


@pytest.mark.django_db
def test_protected_endpoint_rejects_missing_token(api_client):
    response = api_client.get("/api/auth/me/")
    assert response.status_code == 401


def test_extract_skills_finds_known_keywords():
    text = "Experienced with Python, Django, and PostgreSQL. Comfortable with Docker."
    skills = extract_skills(text)
    assert "python" in skills
    assert "django" in skills
    assert "postgresql" in skills
    assert "docker" in skills


def test_extract_skills_ignores_unrelated_words():
    text = "I enjoy hiking and photography on weekends."
    skills = extract_skills(text)
    assert skills == []


@pytest.mark.django_db
def test_resume_upload_extracts_skills(api_client, job_seeker):
    api_client.force_authenticate(user=job_seeker)
    resume_file = io.BytesIO(b"Skilled in React, JavaScript, and Git.")
    resume_file.name = "resume.txt"
    response = api_client.post("/api/resumes/", {"file": resume_file}, format="multipart")
    assert response.status_code == 201
    assert "react" in response.data["extracted_skills"]


@pytest.mark.django_db
def test_job_list_filters_by_job_type(api_client, job_seeker, recruiter):
    Job.objects.create(
        recruiter=recruiter, title="Intern Role", company="Acme",
        description="An internship.", job_type=Job.JobType.INTERNSHIP,
        skills_required=["python"],
    )
    Job.objects.create(
        recruiter=recruiter, title="Full-time Role", company="Acme",
        description="A full-time job.", job_type=Job.JobType.FULL_TIME,
        skills_required=["python"],
    )
    api_client.force_authenticate(user=job_seeker)
    response = api_client.get("/api/jobs/?job_type=internship")
    assert response.status_code == 200
    titles = [j["title"] for j in response.data]
    assert "Intern Role" in titles
    assert "Full-time Role" not in titles


@pytest.mark.django_db
def test_job_list_filters_by_skill(api_client, job_seeker, sample_job):
    Job.objects.create(
        recruiter=sample_job.recruiter, title="Backend Role", company="Acme",
        description="Backend work.", job_type=Job.JobType.FULL_TIME,
        skills_required=["python", "django"],
    )
    api_client.force_authenticate(user=job_seeker)
    response = api_client.get("/api/jobs/?skill=react")
    titles = [j["title"] for j in response.data]
    assert "Frontend Developer" in titles
    assert "Backend Role" not in titles


@pytest.mark.django_db
def test_swipe_right_creates_applied_application(api_client, job_seeker, sample_job):
    api_client.force_authenticate(user=job_seeker)
    response = api_client.post("/api/swipes/", {"job": sample_job.id, "direction": "right"})
    assert response.status_code == 201
    application = Application.objects.get(user=job_seeker, job=sample_job)
    assert application.status == Application.Status.APPLIED


@pytest.mark.django_db
def test_swipe_save_creates_saved_application(api_client, job_seeker, sample_job):
    api_client.force_authenticate(user=job_seeker)
    api_client.post("/api/swipes/", {"job": sample_job.id, "direction": "save"})
    application = Application.objects.get(user=job_seeker, job=sample_job)
    assert application.status == Application.Status.SAVED


@pytest.mark.django_db
def test_swipe_left_creates_no_application(api_client, job_seeker, sample_job):
    api_client.force_authenticate(user=job_seeker)
    api_client.post("/api/swipes/", {"job": sample_job.id, "direction": "left"})
    assert not Application.objects.filter(user=job_seeker, job=sample_job).exists()
    assert Swipe.objects.filter(user=job_seeker, job=sample_job, direction="left").exists()


@pytest.mark.django_db
def test_resubmitting_swipe_updates_not_duplicates(api_client, job_seeker, sample_job):
    api_client.force_authenticate(user=job_seeker)
    api_client.post("/api/swipes/", {"job": sample_job.id, "direction": "left"})
    api_client.post("/api/swipes/", {"job": sample_job.id, "direction": "right"})
    assert Swipe.objects.filter(user=job_seeker, job=sample_job).count() == 1
    swipe = Swipe.objects.get(user=job_seeker, job=sample_job)
    assert swipe.direction == "right"


@pytest.mark.django_db
def test_application_status_change_creates_notification(job_seeker, sample_job):
    application = Application.objects.create(
        user=job_seeker, job=sample_job, status=Application.Status.APPLIED
    )
    application.status = Application.Status.INTERVIEW
    application.save()

    from notifications.models import Notification
    assert Notification.objects.filter(
        user=job_seeker, notification_type=Notification.NotificationType.STATUS_CHANGE
    ).exists()


@pytest.mark.django_db
def test_application_creation_does_not_create_notification(job_seeker, sample_job):
    Application.objects.create(user=job_seeker, job=sample_job, status=Application.Status.SAVED)
    from notifications.models import Notification
    assert not Notification.objects.filter(user=job_seeker).exists()


@pytest.mark.django_db
def test_analytics_summary_reflects_real_data(api_client, job_seeker, sample_job):
    Application.objects.create(user=job_seeker, job=sample_job, status=Application.Status.APPLIED)
    Swipe.objects.create(user=job_seeker, job=sample_job, direction="right")

    api_client.force_authenticate(user=job_seeker)
    response = api_client.get("/api/analytics/summary/")
    assert response.status_code == 200
    assert response.data["applications_by_status"]["applied"] == 1
    assert response.data["swipes_by_direction"]["right"] == 1