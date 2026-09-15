import os
from datetime import datetime, timezone
import pandas as pd

from django.core.management.base import BaseCommand
from django.utils import timezone as dj_tz

from candidates.models import Job


def parse_ms_timestamp(val):
    """
    Safely convert Unix timestamp in milliseconds to timezone-aware UTC datetime.
    Handles NaN, None, 0, strings, and invalid ranges.
    """
    if val is None or pd.isna(val):
        return None
    try:
        val_float = float(val)
        if val_float <= 0:
            return None
        return datetime.fromtimestamp(val_float / 1000.0, tz=timezone.utc)
    except (ValueError, OSError, OverflowError):
        return None


def clean_text_field(val, max_length=None):
    if val is None or pd.isna(val):
        return ""
    text = str(val).strip()
    if text.lower() in ("nan", "none", "null"):
        return ""
    if max_length:
        return text[:max_length]
    return text


class Command(BaseCommand):
    help = (
        "Safely import and sync historical LinkedIn dataset jobs without deleting "
        "existing jobs, swipe history, or applications."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--chunk-size",
            type=int,
            default=5000,
            help="Batch size for database bulk operations (default: 5000)",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Optional limit on number of rows to process",
        )

    def handle(self, *args, **options):
        csv_path = "dataset/postings.csv"
        if not os.path.exists(csv_path):
            csv_path = "backend/dataset/postings.csv"

        if not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR(f"Dataset CSV not found at: {csv_path}"))
            return

        chunk_size = options.get("chunk_size", 5000)
        limit = options.get("limit")

        self.stdout.write(f"Reading dataset from {csv_path}...")
        df = pd.read_csv(csv_path)
        if limit:
            df = df.head(limit)

        total_rows = len(df)
        self.stdout.write(f"Processing {total_rows:,} job records safely...")

        now = dj_tz.now()

        existing_source_ids = set(
            Job.objects.filter(source="dataset")
            .exclude(source_id="")
            .values_list("source_id", flat=True)
        )

        existing_db_count = Job.objects.filter(source="dataset").count()
        self.stdout.write(
            f"Current dataset jobs in database: {existing_db_count:,} "
            f"(with populated source_id: {len(existing_source_ids):,})"
        )

        needs_in_place_update = (
            existing_db_count == total_rows and len(existing_source_ids) == 0
        )

        if needs_in_place_update:
            self.stdout.write(
                "Populating timestamps, source_id, and inactive status on existing database rows..."
            )
            from django.db import connection

            id_iterator = Job.objects.filter(source="dataset").order_by("id").values_list("id", flat=True).iterator(chunk_size=chunk_size)

            updated_count = 0
            inactive_count = 0

            for start in range(0, total_rows, chunk_size):
                end = min(start + chunk_size, total_rows)
                batch_df = df.iloc[start:end]
                batch_ids = [next(id_iterator) for _ in range(len(batch_df))]

                params_list = []
                for (_, row), job_id in zip(batch_df.iterrows(), batch_ids):
                    raw_job_id = row.get("job_id")
                    src_id = (
                        str(int(raw_job_id))
                        if pd.notna(raw_job_id)
                        else str(job_id)
                    )

                    posted_at = parse_ms_timestamp(row.get("listed_time"))
                    expires_at = parse_ms_timestamp(row.get("expiry"))
                    closed_time_raw = row.get("closed_time")

                    is_closed = (
                        pd.notna(closed_time_raw)
                        and float(closed_time_raw or 0) > 0
                    )
                    # For historical dataset jobs, only respect explicit closure.
                    # All expiry values are from 2024 (past), so ignoring expiry
                    # keeps the dataset available as sample data for the platform.
                    is_active = (
                        not is_closed
                        and (
                            expires_at is None
                            or expires_at > now
                        )
                    )

                    if not is_active:
                        inactive_count += 1

                    params_list.append((
                        src_id,
                        posted_at,
                        expires_at,
                        is_active,
                        job_id,
                    ))

                with connection.cursor() as cursor:
                    cursor.executemany(
                        """
                        UPDATE candidates_job
                        SET source = 'dataset',
                            source_id = %s,
                            posted_at = %s,
                            expires_at = %s,
                            is_active = %s
                        WHERE id = %s
                        """,
                        params_list,
                    )

                updated_count += len(params_list)
                self.stdout.write(
                    f"  Updated {updated_count:,}/{total_rows:,} records..."
                )

            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully updated {updated_count:,} dataset jobs in-place "
                    f"({inactive_count:,} marked inactive due to closure/expiry). "
                    f"Preserved all existing swipe history and applications."
                )
            )
            return


        new_jobs = []
        inactive_count = 0
        skipped_duplicates = 0

        for _, row in df.iterrows():
            raw_job_id = row.get("job_id")
            src_id = (
                str(int(raw_job_id))
                if pd.notna(raw_job_id)
                else ""
            )

            if src_id and src_id in existing_source_ids:
                skipped_duplicates += 1
                continue

            posted_at = parse_ms_timestamp(row.get("listed_time"))
            expires_at = parse_ms_timestamp(row.get("expiry"))
            closed_time_raw = row.get("closed_time")

            is_closed = (
                pd.notna(closed_time_raw)
                and float(closed_time_raw or 0) > 0
            )
            # Historical dataset: only mark inactive if explicitly closed.
            is_active = (
    not is_closed
    and (
        expires_at is None
        or expires_at > now
    )
)

            if not is_active:
                inactive_count += 1

            min_sal = row.get("min_salary")
            max_sal = row.get("max_salary")
            pay_period = clean_text_field(row.get("pay_period")).upper()
            period_str = (
                "yr"
                if pay_period in ("YEARLY", "YR", "")
                else "hr"
                if pay_period in ("HOURLY", "HR")
                else pay_period.lower()
            )

            if pd.notna(min_sal) and pd.notna(max_sal):
                sal_val = f"${int(min_sal):,} - ${int(max_sal):,} / {period_str}"
            elif pd.notna(max_sal):
                sal_val = f"Up to ${int(max_sal):,} / {period_str}"
            elif pd.notna(min_sal):
                sal_val = f"From ${int(min_sal):,} / {period_str}"
            else:
                sal_val = ""

            app_url = clean_text_field(row.get("application_url"), 1000)
            if not app_url.startswith("http"):
                app_url = clean_text_field(row.get("job_posting_url"), 1000)
            if not app_url.startswith("http"):
                app_url = ""

            work_type = clean_text_field(row.get("formatted_work_type")).lower()
            remote_allowed = row.get("remote_allowed")
            loc_str = clean_text_field(row.get("location"), 255)
            if remote_allowed == 1 or "remote" in work_type or "remote" in loc_str.lower():
                w_mode = "Remote"
            elif "hybrid" in work_type or "hybrid" in loc_str.lower():
                w_mode = "Hybrid"
            else:
                w_mode = "On-site"

            exp_val = clean_text_field(row.get("formatted_experience_level"), 100)
            if not exp_val:
                exp_val = "Entry to Mid Level"

            new_jobs.append(
                Job(
                    title=clean_text_field(row.get("title"), 255) or "Job Opportunity",
                    company=clean_text_field(row.get("company_name"), 255) or "Unknown",
                    location=loc_str or "Remote",
                    salary=sal_val[:100],
                    work_mode=w_mode[:50],
                    experience=exp_val,
                    description=clean_text_field(row.get("description"), 4000),
                    required_skills=clean_text_field(row.get("skills_desc"), 1000),
                    application_url=app_url,
                    min_ats=50,
                    source="dataset",
                    source_id=src_id,
                    posted_at=posted_at,
                    expires_at=expires_at,
                    is_active=is_active,
                )
            )

            if len(new_jobs) >= chunk_size:
                Job.objects.bulk_create(new_jobs, ignore_conflicts=True)
                new_jobs.clear()

        if new_jobs:
            Job.objects.bulk_create(new_jobs, ignore_conflicts=True)

        self.stdout.write(
            self.style.SUCCESS(
                f"Import complete. Total jobs in DB: {Job.objects.count():,}. "
                f"Skipped duplicates: {skipped_duplicates:,}. "
                f"Historical dataset safely preserved."
            )
        )
