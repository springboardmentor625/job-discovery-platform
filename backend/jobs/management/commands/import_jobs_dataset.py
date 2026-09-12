"""
Imports jobs from the 'Job Descriptions 2025' Kaggle dataset (JSON format)
into the Job table.
"""
import json

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from jobs.models import Job

User = get_user_model()

EXPERIENCE_LEVEL_MAP = {
    "fresher": Job.ExperienceLevel.FRESHER,
    "junior": Job.ExperienceLevel.FRESHER,
    "experienced": Job.ExperienceLevel.MID,
    "mid": Job.ExperienceLevel.MID,
    "lead": Job.ExperienceLevel.SENIOR,
    "senior": Job.ExperienceLevel.SENIOR,
}


def map_experience_level(raw_value):
    return EXPERIENCE_LEVEL_MAP.get((raw_value or "").strip().lower(), Job.ExperienceLevel.MID)


def build_description(entry):
    responsibilities = entry.get("Responsibilities", [])
    keywords = entry.get("Keywords", [])
    parts = []
    if responsibilities:
        parts.append(". ".join(responsibilities) + ".")
    if keywords:
        parts.append("Keywords: " + ", ".join(keywords) + ".")
    return "\n\n".join(parts)


class Command(BaseCommand):
    help = "Import jobs from the Kaggle 'Job Descriptions 2025' JSON dataset."

    def add_arguments(self, parser):
        parser.add_argument(
            "json_path",
            nargs="?",
            default="data/job_dataset.json",
            help="Path to job_dataset.json (default: data/job_dataset.json)",
        )

    def handle(self, *args, **options):
        json_path = options["json_path"]

        try:
            with open(json_path, encoding="utf-8") as f:
                entries = json.load(f)
        except FileNotFoundError:
            raise CommandError(
                f"Couldn't find {json_path}. Run this command from the backend/ "
                f"folder, or pass the full path: python manage.py import_jobs_dataset <path>"
            )

        if not isinstance(entries, list):
            raise CommandError("Expected the JSON file to contain a list of job objects.")

        importer, created = User.objects.get_or_create(
            email="dataset-import@swipex.dev",
            defaults={"username": "dataset_importer", "role": User.Role.RECRUITER},
        )
        if created:
            importer.set_unusable_password()
            importer.save()

        created_count = 0
        skipped_count = 0

        for entry in entries:
            external_id = entry.get("JobID")
            title = entry.get("Title", "").strip()

            if not external_id or not title:
                skipped_count += 1
                continue

            _, was_created = Job.objects.get_or_create(
                external_id=external_id,
                defaults={
                    "recruiter": importer,
                    "title": title,
                    "description": build_description(entry),
                    "experience_level": map_experience_level(entry.get("ExperienceLevel")),
                    "skills_required": entry.get("Skills", []),
                    "company": "Not specified in dataset",
                    "company_type": Job.CompanyType.UNSPECIFIED,
                    "job_type": Job.JobType.FULL_TIME,
                    "location": "",
                },
            )
            if was_created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Imported {created_count} new job(s) from {json_path}. "
                f"Skipped {skipped_count} entr(y/ies) missing JobID/Title. "
                f"Total entries in file: {len(entries)}."
            )
        )