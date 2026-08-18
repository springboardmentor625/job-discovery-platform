"""
Seeds a handful of sample jobs so the Job Seeker workflow (recommended jobs
+ swipe deck) has data to work with, since job-posting by recruiters isn't
built yet. Run with: python manage.py seed_jobs
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from jobs.models import Job

User = get_user_model()

SAMPLE_JOBS = [
    {
        "company": "Nimbus Cloud", "title": "Backend Engineer (Django)",
        "description": "Build and maintain REST APIs powering our core platform.",
        "job_type": "full_time", "location": "Remote",
        "salary_min": 800000, "salary_max": 1400000,
        "skills_required": ["python", "django", "django rest framework", "postgresql", "docker"],
    },
    {
        "company": "Nimbus Cloud", "title": "Frontend Engineer Intern",
        "description": "Work on our React-based dashboard alongside senior engineers.",
        "job_type": "internship", "location": "Bengaluru, IN",
        "salary_min": 25000, "salary_max": 40000,
        "skills_required": ["javascript", "react", "html", "css", "git"],
    },
    {
        "company": "DataForge", "title": "Data Analyst",
        "description": "Turn raw data into dashboards and insights for the product team.",
        "job_type": "full_time", "location": "Hyderabad, IN",
        "salary_min": 600000, "salary_max": 900000,
        "skills_required": ["sql", "python", "pandas", "data visualization", "excel"],
    },
    {
        "company": "Skyline Labs", "title": "Machine Learning Engineer",
        "description": "Design and ship ML models for our recommendation system.",
        "job_type": "full_time", "location": "Remote",
        "salary_min": 1200000, "salary_max": 2000000,
        "skills_required": ["python", "machine learning", "pytorch", "scikit-learn", "sql"],
    },
    {
        "company": "Verve Startups", "title": "Full Stack Developer",
        "description": "Own features end to end across our React + Django stack.",
        "job_type": "full_time", "location": "Pune, IN",
        "salary_min": 700000, "salary_max": 1100000,
        "skills_required": ["react", "django", "javascript", "postgresql", "rest api"],
    },
    {
        "company": "Verve Startups", "title": "DevOps Engineer",
        "description": "Manage our CI/CD pipelines and cloud infrastructure.",
        "job_type": "full_time", "location": "Remote",
        "salary_min": 900000, "salary_max": 1500000,
        "skills_required": ["docker", "kubernetes", "aws", "ci/cd", "terraform"],
    },
    {
        "company": "BrightPath Education", "title": "Junior Software Engineer",
        "description": "Fresher-friendly role building features for our learning platform.",
        "job_type": "full_time", "location": "Chennai, IN",
        "salary_min": 400000, "salary_max": 600000,
        "skills_required": ["python", "sql", "git", "problem solving"],
    },
    {
        "company": "Lumen Analytics", "title": "Business Intelligence Intern",
        "description": "Build reports and dashboards for internal stakeholders.",
        "job_type": "internship", "location": "Remote",
        "salary_min": 15000, "salary_max": 25000,
        "skills_required": ["excel", "power bi", "sql", "communication"],
    },
]


class Command(BaseCommand):
    help = "Seed sample jobs for local development/testing of the Job Seeker workflow."

    def handle(self, *args, **options):
        recruiter, created = User.objects.get_or_create(
            email="recruiter@swipex.dev",
            defaults={"username": "sample_recruiter", "role": User.Role.RECRUITER},
        )
        if created:
            recruiter.set_unusable_password()
            recruiter.save()
            self.stdout.write(self.style.SUCCESS(f"Created sample recruiter: {recruiter.email}"))

        created_count = 0
        for job_data in SAMPLE_JOBS:
            _, was_created = Job.objects.get_or_create(
                title=job_data["title"], company=job_data["company"],
                defaults={**job_data, "recruiter": recruiter},
            )
            if was_created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(f"Seeded {created_count} new job(s). {len(SAMPLE_JOBS)} total defined.")
        )