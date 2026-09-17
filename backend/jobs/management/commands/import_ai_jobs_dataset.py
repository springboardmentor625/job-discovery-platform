"""
Imports jobs from the 'AI Job Market Global 2026' Kaggle dataset (CSV format).
Unlike the previous dataset, this one has REAL company names, locations, and
salaries — scraped from Adzuna/USAJobs. Its own 'required_skills' column is
thin (often a single word or blank), so we supplement it with keyword
extraction from the actual job description text, reusing the same
SKILL_KEYWORDS list the resume parser uses.

Run with: python manage.py import_ai_jobs_dataset data/ai_jobs_global.csv
"""
import csv
import hashlib

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from jobs.models import Job
from resumes.parsing import extract_skills

User = get_user_model()

EXPERIENCE_LEVEL_MAP = {
    "junior": Job.ExperienceLevel.FRESHER,
    "entry": Job.ExperienceLevel.FRESHER,
    "mid-level": Job.ExperienceLevel.MID,
    "mid": Job.ExperienceLevel.MID,
    "senior": Job.ExperienceLevel.SENIOR,
    "lead": Job.ExperienceLevel.SENIOR,
    "manager": Job.ExperienceLevel.SENIOR,
    "executive": Job.ExperienceLevel.SENIOR,
}


def map_experience_level(raw_value):
    return EXPERIENCE_LEVEL_MAP.get((raw_value or "").strip().lower(), Job.ExperienceLevel.MID)


def map_job_type(remote_type):
    if (remote_type or "").strip().lower() == "remote":
        return Job.JobType.REMOTE
    return Job.JobType.FULL_TIME  # dataset has no internship/contract signal


def parse_salary(value):
    try:
        if value in (None, "", "nan", "NaN"):
            return None
        return int(float(value))
    except (ValueError, TypeError):
        return None


def build_external_id(row):
    """No unique ID column in this dataset — derive a stable one so re-imports don't duplicate."""
    key = f"{row.get('job_title', '')}|{row.get('company', '')}|{row.get('city', '')}|{row.get('posted_date', '')}"
    return "AIGM-" + hashlib.md5(key.encode()).hexdigest()[:16]


def build_skills(row):
    """Combine the dataset's own (often thin) required_skills column with skills
    extracted from the actual job description text."""
    skills = set()
    column_skill = (row.get("required_skills") or "").strip()
    if column_skill:
        skills.add(column_skill.lower())

    description = row.get("job_description", "") or ""
    skills.update(extract_skills(description))
    return sorted(skills)


class Command(BaseCommand):
    help = "Import jobs from the Kaggle 'AI Job Market Global 2026' CSV dataset."

    def add_arguments(self, parser):
        parser.add_argument(
            "csv_path",
            nargs="?",
            default="data/ai_jobs_global.csv",
            help="Path to the CSV (default: data/ai_jobs_global.csv)",
        )

    def handle(self, *args, **options):
        csv_path = options["csv_path"]

        try:
            f = open(csv_path, encoding="utf-8")
        except FileNotFoundError:
            raise CommandError(
                f"Couldn't find {csv_path}. Run this from the backend/ folder, "
                f"or pass the full path: python manage.py import_ai_jobs_dataset <path>"
            )

        with f:
            reader = csv.DictReader(f)

            importer, created = User.objects.get_or_create(
                email="dataset-import@swipex.dev",
                defaults={"username": "dataset_importer", "role": User.Role.RECRUITER},
            )
            if created:
                importer.set_unusable_password()
                importer.save()

            created_count = 0
            skipped_count = 0
            total = 0

            for row in reader:
                total += 1
                title = (row.get("job_title") or "").strip()
                company = (row.get("company") or "").strip()

                if not title or not company:
                    skipped_count += 1
                    continue

                city = (row.get("city") or "").strip()
                country = (row.get("country") or "").strip()
                location = ", ".join(part for part in [city, country] if part)

                _, was_created = Job.objects.get_or_create(
                    external_id=build_external_id(row),
                    defaults={
                        "recruiter": importer,
                        "title": title,
                        "company": company,
                        "company_type": Job.CompanyType.UNSPECIFIED,  # not in this dataset either
                        "description": row.get("job_description", "") or "",
                        "job_type": map_job_type(row.get("remote_type")),
                        "experience_level": map_experience_level(row.get("experience_level")),
                        "location": location,
                        "salary_min": parse_salary(row.get("salary_min")),
                        "salary_max": parse_salary(row.get("salary_max")),
                        "skills_required": build_skills(row),
                    },
                )
                if was_created:
                    created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Imported {created_count} new job(s) from {csv_path}. "
                f"Skipped {skipped_count} row(s) missing title/company. "
                f"Total rows in file: {total}."
            )
        )