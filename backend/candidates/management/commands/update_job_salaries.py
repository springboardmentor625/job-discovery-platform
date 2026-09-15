import os
import pandas as pd
from django.core.management.base import BaseCommand
from candidates.models import Job


class Command(BaseCommand):
    help = "Populate real salaries and application URLs from dataset/postings.csv into Job records"

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Limit number of jobs to update (0 for all)",
        )

    def handle(self, *args, **options):
        limit = options.get("limit", 0)
        csv_path = "dataset/postings.csv"

        if not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR(f"File {csv_path} not found."))
            return

        self.stdout.write("Reading postings.csv...")
        chunksize = 5000
        total_updated = 0
        current_id = 1

        for chunk in pd.read_csv(csv_path, chunksize=chunksize):
            chunk_len = len(chunk)
            end_id = current_id + chunk_len - 1
            jobs = list(Job.objects.filter(id__gte=current_id, id__lte=end_id).order_by("id"))

            if not jobs:
                current_id += chunk_len
                continue

            to_update = []
            for j, (_, row) in zip(jobs, chunk.iterrows()):
                changed = False

                min_sal = row.get("min_salary")
                max_sal = row.get("max_salary")
                pay_period = str(row.get("pay_period", "") or "").strip().upper()
                period_str = "yr" if pay_period in ("YEARLY", "YR", "") else "hr" if pay_period in ("HOURLY", "HR") else pay_period.lower()

                if pd.notna(min_sal) and pd.notna(max_sal):
                    new_sal = f"${int(min_sal):,} - ${int(max_sal):,} / {period_str}"
                elif pd.notna(max_sal):
                    new_sal = f"Up to ${int(max_sal):,} / {period_str}"
                elif pd.notna(min_sal):
                    new_sal = f"From ${int(min_sal):,} / {period_str}"
                else:
                    new_sal = ""

                if j.salary != new_sal:
                    j.salary = new_sal
                    changed = True

                app_url = str(row.get("application_url", "") or "").strip()
                if not app_url.startswith("http"):
                    app_url = str(row.get("job_posting_url", "") or "").strip()
                if not app_url.startswith("http"):
                    app_url = ""

                if app_url and j.application_url != app_url[:1000]:
                    j.application_url = app_url[:1000]
                    changed = True

                work_type = str(row.get("formatted_work_type", "") or "").lower()
                remote_allowed = row.get("remote_allowed")
                loc_lower = str(j.location or "").lower()
                if remote_allowed == 1 or "remote" in work_type or "remote" in loc_lower:
                    new_mode = "Remote"
                elif "hybrid" in work_type or "hybrid" in loc_lower:
                    new_mode = "Hybrid"
                else:
                    new_mode = "On-site"

                if j.work_mode != new_mode:
                    j.work_mode = new_mode
                    changed = True

                exp = str(row.get("formatted_experience_level", "") or "").strip()
                if exp and exp.lower() != "nan" and j.experience != exp:
                    j.experience = exp[:100]
                    changed = True

                if changed:
                    to_update.append(j)

            if to_update:
                Job.objects.bulk_update(
                    to_update,
                    ["salary", "application_url", "work_mode", "experience"],
                    batch_size=1000,
                )
                total_updated += len(to_update)

            current_id += chunk_len
            self.stdout.write(f"Processed up to job ID {end_id}. Total updated: {total_updated}")

            if limit > 0 and current_id > limit:
                break

        self.stdout.write(self.style.SUCCESS(f"Finished updating job dataset! Total records updated: {total_updated}"))
