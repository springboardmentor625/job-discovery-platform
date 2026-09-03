import time

from django.core.management.base import BaseCommand
from users.models import Job
from users.llm.job_extractor import extract_job_requirements


class Command(BaseCommand):

    help = "Extract job requirements using LLM"

    def handle(self, *args, **options):

        # Only process jobs that have not been extracted yet
        jobs = Job.objects.filter(
            requirements_extracted=False
        )

        if not jobs.exists():
            self.stdout.write(
                self.style.SUCCESS(
                    "No jobs remaining for LLM extraction."
                )
            )
            return

        total = jobs.count()

        self.stdout.write(
            f"Found {total} jobs requiring LLM extraction."
        )

        updated_count = 0
        failed_count = 0

        for job in jobs:

            try:

                result = extract_job_requirements(
                    job.description or ""
                )

                job.required_skills = result.get(
                    "required_skills",
                    []
                )

                job.requirements_extracted = True

                job.save(
                    update_fields=[
                        "required_skills",
                        "requirements_extracted",
                    ]
                )

                updated_count += 1

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Processed: {job.title}"
                    )
                )

                time.sleep(3)

            except Exception as e:

                failed_count += 1

                self.stdout.write(
                    self.style.ERROR(
                        f"Failed: {job.title} - {str(e)}"
                    )
                )

                # Stop immediately if Groq rate limit is reached
                if "429" in str(e):
                    self.stdout.write(
                        self.style.WARNING(
                            "Groq rate limit reached. "
                            "Stopping extraction."
                        )
                    )
                    break

        self.stdout.write("")

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully processed: {updated_count}"
            )
        )

        self.stdout.write(
            self.style.WARNING(
                f"Failed: {failed_count}"
            )
        )