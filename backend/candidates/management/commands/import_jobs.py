import pandas as pd

from django.core.management.base import BaseCommand

from candidates.models import Job


class Command(BaseCommand):
    help = "Import LinkedIn jobs"

    def handle(self, *args, **kwargs):

        csv_path = "dataset/postings.csv"

        df = pd.read_csv(csv_path)

        Job.objects.all().delete()

        jobs = []

        for _, row in df.iterrows():

            desc = str(row.get("description", "") or "")
            if desc.lower() == "nan":
                desc = ""
            jobs.append(
                Job(
                    title=str(row.get("title", ""))[:100],
                    company=str(row.get("company_name", "Unknown"))[:100],
                    location=str(row.get("location", ""))[:100],
                    description=desc[:1500],
                    required_skills=str(
                        row.get("skills_desc", "")
                    ),
                    min_ats=50,
                )
            )

        Job.objects.bulk_create(jobs)

        self.stdout.write(
            self.style.SUCCESS(
                f"{Job.objects.count()} jobs imported."
            )
        )