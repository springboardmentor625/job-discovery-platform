import csv
import os
import re
from datetime import datetime, timezone

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db.models import Count, Q
from django.utils import timezone as dj_tz

from candidates.models import Job
from candidates.utils.matcher import normalize_skills
from candidates.utils.resume_parser import extract_skills


def parse_ms_timestamp(val):
    """
    Safely convert Unix timestamp in milliseconds or ISO format to timezone-aware UTC datetime.
    """
    if val is None:
        return None
    val_str = str(val).strip()
    if not val_str or val_str.lower() in ("nan", "none", "null", "0"):
        return None
    try:
        val_float = float(val_str)
        if val_float <= 0:
            return None
        if val_float < 1e11:
            return datetime.fromtimestamp(val_float, tz=timezone.utc)
        return datetime.fromtimestamp(val_float / 1000.0, tz=timezone.utc)
    except (ValueError, OSError, OverflowError):
        pass

    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%SZ"):
        try:
            return datetime.strptime(val_str, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def clean_text_field(val, max_length=None):
    if val is None:
        return ""
    text = str(val).strip()
    if text.lower() in ("nan", "none", "null", "undefined"):
        return ""
    if max_length:
        return text[:max_length]
    return text


class Command(BaseCommand):
    help = (
        "Safely import active and historical tech job datasets into PostgreSQL as an "
        "additional source without deleting existing jobs, swipe history, or applications."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--path",
            type=str,
            default=None,
            help="Custom path to the CSV dataset file (default: backend/dataset/postings.csv)",
        )
        parser.add_argument(
            "--source",
            type=str,
            default="active_csv",
            help="Source identifier for the imported jobs (default: active_csv)",
        )
        parser.add_argument(
            "--chunk-size",
            type=int,
            default=1000,
            help="Batch size for database bulk operations (default: 1000)",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Optional limit on number of rows to process",
        )
        parser.add_argument(
            "--sync-apis",
            action="store_true",
            help="Safely trigger Jobicy and RemoteOK fetcher alongside the CSV import",
        )

    def handle(self, *args, **options):
        custom_path = options.get("path")
        candidate_paths = [
            custom_path,
            "backend/dataset/postings.csv",
            "dataset/postings.csv",
            "backend/dataset/large_tech_job_dataset_india-selected-columns.csv",
            "dataset/large_tech_job_dataset_india-selected-columns.csv",
        ]
        csv_path = None
        for p in candidate_paths:
            if p and os.path.exists(p):
                csv_path = p
                break

        if not csv_path:
            self.stdout.write(
                self.style.ERROR(
                    f"Dataset CSV not found. Checked: {[p for p in candidate_paths if p]}"
                )
            )
            return

        target_source = options.get("source", "active_csv").strip()
        chunk_size = options.get("chunk_size", 1000)
        limit = options.get("limit")
        now = dj_tz.now()

        self.stdout.write(
            self.style.MIGRATE_HEADING(
                f"=== SwipeX Job Ingestion: {csv_path} (Source: '{target_source}') ==="
            )
        )

        # 1. Inspect actual columns and file format
        with open(csv_path, mode="r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            fieldnames = [fn.strip() for fn in (reader.fieldnames or [])]

        self.stdout.write(f"Detected columns ({len(fieldnames)}): {', '.join(fieldnames)}")

        is_10_col_india_dataset = "job_apply_link" in fieldnames and "employer_name" in fieldnames

        # 2. Collect existing IDs and signatures for strict deduplication
        existing_source_ids = set(
            Job.objects.filter(source=target_source)
            .exclude(source_id="")
            .values_list("source_id", flat=True)
        )
        existing_signatures = set(
            Job.objects.filter(is_active=True)
            .values_list("company", "title")
        )
        existing_signatures_normalized = {
            (c.strip().lower(), t.strip().lower())
            for c, t in existing_signatures
            if c and t
        }

        self.stdout.write(
            f"Pre-existing '{target_source}' jobs in DB: {len(existing_source_ids):,} "
            f"(Total active jobs in DB: {Job.objects.filter(is_active=True).count():,})"
        )

        added_count = 0
        skipped_duplicates = 0
        updated_count = 0
        failed_count = 0
        seen_in_batch = set()

        jobs_to_create = []

        with open(csv_path, mode="r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            for row_idx, raw_row in enumerate(reader, start=1):
                if limit and row_idx > limit:
                    break

                try:
                    row = {k.strip(): v for k, v in raw_row.items() if k}

                    if is_10_col_india_dataset:
                        raw_job_id = clean_text_field(row.get("job_id"), 150)
                        title = clean_text_field(row.get("job_title"), 255) or "Software Engineer"
                        company = clean_text_field(row.get("employer_name"), 255) or "Tech Company"
                        apply_url = clean_text_field(row.get("job_apply_link"), 1000)

                        if not raw_job_id:
                            raw_job_id = f"india_{row_idx}"

                        if raw_job_id in existing_source_ids or raw_job_id in seen_in_batch:
                            skipped_duplicates += 1
                            continue

                        sig = (company.strip().lower(), title.strip().lower())
                        if sig in existing_signatures_normalized and apply_url:
                            if Job.objects.filter(company__iexact=company, title__iexact=title, application_url=apply_url).exists():
                                skipped_duplicates += 1
                                continue

                        seen_in_batch.add(raw_job_id)

                        emp_type = clean_text_field(row.get("job_employment_type"), 50)
                        lower_title = title.lower()

                        if "remote" in lower_title or "remote" in emp_type.lower():
                            work_mode = "Remote"
                            location = "Remote, India"
                        elif "hybrid" in lower_title:
                            work_mode = "Hybrid"
                            location = "India"
                        else:
                            work_mode = "On-site"
                            location = "India"

                        extracted = extract_skills(title)
                        normalized_skills = normalize_skills(extracted) if extracted else []
                        skills_str = ", ".join(normalized_skills) if normalized_skills else ""

                        if any(w in lower_title for w in ("senior", "sr.", "lead", "principal", "architect")):
                            exp = "5+ years (Senior)"
                        elif any(w in lower_title for w in ("junior", "jr.", "entry", "intern", "associate")):
                            exp = "0-2 years (Entry Level)"
                        elif any(w in lower_title for w in ("mid", "specialist", "engineer 2", "analyst")):
                            exp = "2-5 years (Mid Level)"
                        else:
                            exp = "Entry to Mid Level"

                        publisher = clean_text_field(row.get("job_publisher"), 100)
                        website = clean_text_field(row.get("employer_website"), 255)
                        desc_parts = [f"Job Opportunity: {title} at {company}."]
                        if publisher:
                            desc_parts.append(f"Published via {publisher}.")
                        if emp_type:
                            desc_parts.append(f"Employment Type: {emp_type}.")
                        if website:
                            desc_parts.append(f"Company Website: {website}.")
                        description = " ".join(desc_parts)

                        jobs_to_create.append(
                            Job(
                                title=title,
                                company=company,
                                location=location,
                                work_mode=work_mode,
                                salary="",
                                experience=exp,
                                description=description,
                                required_skills=skills_str,
                                application_url=apply_url,
                                min_ats=50,
                                source=target_source,
                                source_id=raw_job_id,
                                posted_at=now,
                                expires_at=None,
                                is_active=True,
                            )
                        )

                    else:
                        raw_job_id = clean_text_field(row.get("job_id"), 150)
                        if not raw_job_id:
                            raw_job_id = str(row_idx)

                        if raw_job_id in existing_source_ids or raw_job_id in seen_in_batch:
                            skipped_duplicates += 1
                            continue

                        seen_in_batch.add(raw_job_id)

                        posted_at = parse_ms_timestamp(row.get("listed_time"))
                        expires_at = parse_ms_timestamp(row.get("expiry"))
                        closed_time = clean_text_field(row.get("closed_time"))
                        is_closed = bool(closed_time and float(closed_time or 0) > 0)
                        is_active = not is_closed and (expires_at is None or expires_at > now)

                        app_url = clean_text_field(row.get("application_url"), 1000) or clean_text_field(row.get("job_posting_url"), 1000)

                        jobs_to_create.append(
                            Job(
                                title=clean_text_field(row.get("title"), 255) or "Job Opportunity",
                                company=clean_text_field(row.get("company_name"), 255) or "Company",
                                location=clean_text_field(row.get("location"), 255) or "Remote",
                                work_mode="On-site",
                                salary="",
                                experience=clean_text_field(row.get("formatted_experience_level"), 100) or "Entry to Mid Level",
                                description=clean_text_field(row.get("description"), 4000),
                                required_skills=clean_text_field(row.get("skills_desc"), 1000),
                                application_url=app_url,
                                min_ats=50,
                                source=target_source,
                                source_id=raw_job_id,
                                posted_at=posted_at,
                                expires_at=expires_at,
                                is_active=is_active,
                            )
                        )

                    if len(jobs_to_create) >= chunk_size:
                        created_objs = Job.objects.bulk_create(jobs_to_create, ignore_conflicts=True)
                        added_count += len(created_objs)
                        jobs_to_create.clear()

                except Exception:
                    failed_count += 1

            if jobs_to_create:
                created_objs = Job.objects.bulk_create(jobs_to_create, ignore_conflicts=True)
                added_count += len(created_objs)
                jobs_to_create.clear()

        # 3. Optional live API sync
        if options.get("sync_apis"):
            self.stdout.write("\nRefreshing live APIs (Jobicy & RemoteOK)...")
            try:
                call_command("fetch_live_jobs", source="all")
            except Exception as api_err:
                self.stdout.write(self.style.WARNING(f"Live API refresh encountered: {api_err}"))

        # 4. Comprehensive source reporting
        self.stdout.write("\n" + "=" * 55)
        self.stdout.write(self.style.SUCCESS("=== DATASET INGESTION & COMBINED JOB REPORT ==="))
        self.stdout.write("=" * 55)
        self.stdout.write(f"Jobs Added from CSV:   {added_count:,}")
        self.stdout.write(f"Duplicates Skipped:    {skipped_duplicates:,}")
        self.stdout.write(f"Records Updated:       {updated_count:,}")
        self.stdout.write(f"Failed Records:        {failed_count:,}")
        self.stdout.write("-" * 55)
        self.stdout.write("Database Breakdown by Source:")

        sources_summary = list(
            Job.objects.values("source")
            .annotate(
                total=Count("id"),
                active=Count("id", filter=Q(is_active=True)),
            )
            .order_by("source")
        )

        total_db_jobs = 0
        total_active_jobs = 0

        for s in sources_summary:
            src_name = s["source"] or "unspecified"
            src_total = s["total"]
            src_active = s["active"]
            total_db_jobs += src_total
            total_active_jobs += src_active
            self.stdout.write(
                f"  • {src_name.ljust(15)} : {src_active:,} active / {src_total:,} total"
            )

        self.stdout.write("-" * 55)
        self.stdout.write(
            self.style.SUCCESS(
                f"GRAND TOTAL: {total_active_jobs:,} active jobs / {total_db_jobs:,} total jobs in PostgreSQL."
            )
        )
        self.stdout.write(
            "Limitation note: Historical dataset jobs with expired dates are preserved as inactive; "
            "new active dataset jobs with valid direct links are marked active for matching."
        )
        self.stdout.write("=" * 55)

