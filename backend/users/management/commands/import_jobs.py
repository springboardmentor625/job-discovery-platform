import csv
import os

from django.core.management.base import BaseCommand
from django.conf import settings

from users.models import Job


class Command(BaseCommand):

    help = "Import jobs from LinkedIn Jobs CSV dataset"

    def handle(self, *args, **options):

        csv_path = os.path.join(
            settings.BASE_DIR,
            "data",
            "LinkedIn_Jobs_Data_India.csv"
        )

        if not os.path.exists(csv_path):
            self.stdout.write(
                self.style.ERROR(
                    f"CSV file not found: {csv_path}"
                )
            )
            return

        imported_count = 0
        skipped_count = 0

        with open(
            csv_path,
            "r",
            encoding="utf-8-sig",
            newline=""
        ) as file:

            reader = csv.DictReader(file)

            for row in reader:

                job_id = row.get("id")

                if not job_id:
                    skipped_count += 1
                    continue

                try:
                    job_id = int(float(job_id))
                except (ValueError, TypeError):
                    skipped_count += 1
                    continue

                _, created = Job.objects.update_or_create(
                    job_id=job_id,
                    defaults={
                        "title": row.get("title", "").strip(),
                        "company_name": row.get(
                            "companyName", ""
                        ).strip(),
                        "description": row.get(
                            "description", ""
                        ).strip(),
                        "experience_level": row.get(
                            "experienceLevel", ""
                        ).strip(),
                        "contract_type": row.get(
                            "contractType", ""
                        ).strip(),
                        "work_type": row.get(
                            "workType", ""
                        ).strip(),
                        "sector": row.get(
                            "sector", ""
                        ).strip(),
                        "city": row.get(
                            "city", ""
                        ).strip(),
                        "state": row.get(
                            "state", ""
                        ).strip(),
                        "published_at": row.get(
                            "publishedAt", ""
                        ).strip(),
                    }
                )

                if created:
                    imported_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully imported {imported_count} jobs."
            )
        )

        if skipped_count:
            self.stdout.write(
                self.style.WARNING(
                    f"Skipped {skipped_count} invalid rows."
                )
            )