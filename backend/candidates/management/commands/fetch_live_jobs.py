"""
Fetch fresh technical and non-technical jobs from Jobicy and RemoteOK.

Usage:
    python manage.py fetch_live_jobs
    python manage.py fetch_live_jobs --dry-run
    python manage.py fetch_live_jobs --source jobicy
    python manage.py fetch_live_jobs --source remoteok
"""

import html
import logging
import re
from datetime import datetime

import requests
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone as dj_tz

from candidates.models import Job


logger = logging.getLogger(__name__)


# =========================================================
# API CONFIGURATION
# =========================================================

JOBICY_BASE = "https://jobicy.com/api/v2/remote-jobs"
REMOTEOK_URL = "https://remoteok.com/api"

JOBICY_COUNT = 20


# =========================================================
# JOBICY INDUSTRY / TAGS
# =========================================================

JOBICY_INDUSTRY_TAGS = [
    # Engineering
    ("engineering", ""),
    ("engineering", "python"),
    ("engineering", "java"),
    ("engineering", "javascript"),
    ("engineering", "typescript"),
    ("engineering", "react"),
    ("engineering", "angular"),
    ("engineering", "vue"),
    ("engineering", "node"),
    ("engineering", "django"),
    ("engineering", "flask"),
    ("engineering", "backend"),
    ("engineering", "frontend"),
    ("engineering", "full-stack"),
    ("engineering", "software"),
    ("engineering", "mobile"),
    ("engineering", "android"),
    ("engineering", "ios"),
    ("engineering", "qa"),
    ("engineering", "testing"),
    ("engineering", "devops"),
    ("engineering", "cloud"),
    ("engineering", "aws"),
    ("engineering", "azure"),
    ("engineering", "gcp"),
    ("engineering", "cybersecurity"),
    ("engineering", "security"),
    ("engineering", "networking"),
    ("engineering", "database"),
    ("engineering", "sql"),

    # Data / AI
    ("engineering", "data"),
    ("engineering", "data-science"),
    ("engineering", "data-analysis"),
    ("engineering", "machine-learning"),
    ("engineering", "artificial-intelligence"),
    ("engineering", "deep-learning"),
    ("engineering", "nlp"),
    ("engineering", "computer-vision"),
    ("engineering", "big-data"),

    # Product
    ("product", ""),
    ("product", "product-manager"),
    ("product", "product-management"),

    # Business
    ("business", ""),
    ("business", "business-analysis"),
    ("business", "business-development"),

    # Operations
    ("operations", ""),
    ("operations", "project-management"),
    ("operations", "program-management"),
    ("operations", "strategy"),

    # Marketing
    ("marketing", ""),
    ("marketing", "digital-marketing"),
    ("marketing", "seo"),
    ("marketing", "social-media"),
    ("marketing", "content"),
    ("marketing", "content-writing"),
    ("marketing", "copywriting"),

    # Writing
    ("writing", ""),
    ("writing", "technical-writing"),
    ("writing", "editing"),

    # Design
    ("design", ""),
    ("design", "ui"),
    ("design", "ux"),
    ("design", "ui-ux"),
    ("design", "graphic-design"),
    ("design", "product-design"),
    ("design", "illustration"),
    ("design", "video"),

    # Finance
    ("finance", ""),
    ("finance", "accounting"),
    ("finance", "financial-analysis"),
    ("finance", "investment"),
    ("finance", "banking"),

    # HR
    ("hr", ""),
    ("hr", "recruiting"),
    ("hr", "talent-acquisition"),

    # Administration
    ("administration", ""),

    # Sales
    ("sales", ""),
    ("sales", "account-management"),
    ("sales", "business-development"),

    # Customer
    ("customer-support", ""),
    ("customer-success", ""),
    ("customer-service", ""),

    # Other professional areas
    ("legal", ""),
    ("healthcare", ""),
    ("education", ""),
    ("research", ""),
    ("consulting", ""),
    ("retail", ""),
    ("logistics", ""),
    ("quality-assurance", ""),
]


# =========================================================
# REGEX
# =========================================================

HTML_TAG_RE = re.compile(r"<[^>]+>")


# =========================================================
# TEXT HELPERS
# =========================================================

def strip_html(text: str) -> str:
    """
    Remove HTML tags and decode HTML entities.
    """
    text = HTML_TAG_RE.sub(" ", text or "")
    text = html.unescape(text)

    return re.sub(r"\s+", " ", text).strip()


def clean_text(value, max_length=4000) -> str:
    """
    Clean text and limit its database length.
    """
    return strip_html(str(value or ""))[:max_length]


# =========================================================
# DATE HELPERS
# =========================================================

def parse_iso(value):
    """
    Convert ISO date string into timezone-aware datetime.
    """
    if not value:
        return None

    try:
        value = str(value).strip().replace("Z", "+00:00")

        parsed = datetime.fromisoformat(value)

        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=dj_tz.utc)

        return parsed

    except Exception:
        return None


# =========================================================
# EXPERIENCE LEVEL
# =========================================================

def map_level(level: str) -> str:
    """
    Convert source-specific experience levels into
    consistent SwipeX values.
    """

    value = (level or "").lower()

    if any(
        word in value
        for word in (
            "senior",
            "lead",
            "staff",
            "principal",
            "director",
            "vp",
            "executive",
        )
    ):
        return "Senior Level"

    if any(
        word in value
        for word in (
            "mid",
            "intermediate",
            "associate",
            "experienced",
        )
    ):
        return "Mid Level"

    if any(
        word in value
        for word in (
            "junior",
            "entry",
            "intern",
            "internship",
            "graduate",
            "trainee",
            "fresher",
        )
    ):
        return "Entry Level"

    return "Entry to Mid Level"


# =========================================================
# WORK MODE
# =========================================================

def map_work_mode(job_types=None, location="") -> str:
    """
    Normalize work mode.
    """

    job_types_text = " ".join(job_types or []).lower()
    location_text = (location or "").lower()

    if (
        "hybrid" in job_types_text
        or "hybrid" in location_text
    ):
        return "Hybrid"

    if (
        "on-site" in job_types_text
        or "onsite" in job_types_text
    ):
        return "On-site"

    return "Remote"


# =========================================================
# SKILL EXTRACTION
# =========================================================

def build_skills(*values, max_length=500) -> str:
    """
    Extract known technical and professional skills
    from job title, description, tags, industry, etc.
    """

    combined = " ".join(
        str(value or "")
        for value in values
    ).lower()

    skill_keywords = [
        # Programming
        "python",
        "java",
        "c",
        "c++",
        "c#",
        "javascript",
        "typescript",
        "react",
        "angular",
        "vue",
        "node",
        "django",
        "flask",
        "spring",
        "php",
        "ruby",
        "go",
        "rust",
        "kotlin",
        "swift",

        # Web
        "html",
        "css",
        "tailwind",
        "rest api",
        "graphql",
        "full stack",
        "backend",
        "frontend",
        "software development",
        "mobile development",

        # Databases
        "sql",
        "mysql",
        "postgresql",
        "mongodb",
        "oracle",

        # Data
        "pandas",
        "numpy",
        "scikit-learn",
        "tensorflow",
        "pytorch",
        "machine learning",
        "deep learning",
        "artificial intelligence",
        "data science",
        "data analysis",
        "data engineering",
        "nlp",
        "computer vision",
        "power bi",
        "tableau",
        "excel",
        "statistics",
        "spark",

        # Cloud / DevOps
        "aws",
        "azure",
        "gcp",
        "docker",
        "kubernetes",
        "jenkins",
        "git",
        "github",
        "gitlab",
        "linux",
        "devops",
        "cloud computing",

        # Security
        "cybersecurity",
        "network security",
        "penetration testing",
        "information security",

        # QA
        "qa",
        "testing",
        "selenium",
        "automation",

        # Business
        "business analysis",
        "business development",
        "project management",
        "program management",
        "product management",
        "operations",
        "strategy",
        "consulting",
        "process improvement",
        "scrum",
        "agile",
        "leadership",
        "stakeholder management",

        # Marketing
        "digital marketing",
        "marketing",
        "seo",
        "sem",
        "social media",
        "content marketing",
        "content writing",
        "copywriting",
        "email marketing",
        "brand management",
        "market research",

        # Communication
        "communication",
        "technical writing",
        "editing",

        # Design
        "ui",
        "ux",
        "ui/ux",
        "figma",
        "adobe",
        "graphic design",
        "product design",
        "visual design",
        "illustration",
        "video editing",

        # Finance
        "accounting",
        "finance",
        "financial analysis",
        "banking",
        "investment",
        "risk analysis",
        "auditing",
        "taxation",

        # HR
        "human resources",
        "hr",
        "recruitment",
        "recruiting",
        "talent acquisition",
        "payroll",

        # Customer / Sales
        "sales",
        "inside sales",
        "account management",
        "customer success",
        "customer support",
        "customer service",
        "relationship management",

        # Other
        "retail",
        "client handling",
        "problem solving",
        "research",
        "education",
        "training",
        "healthcare",
        "legal",
        "logistics",
        "supply chain",
        "time management",
        "teamwork",
        "presentation",
        "negotiation",
        "analytical skills",
    ]

    found_skills = []

    for skill in skill_keywords:
        if skill in combined and skill not in found_skills:
            found_skills.append(skill)

    return ", ".join(found_skills)[:max_length]


# =========================================================
# JOBICY FETCHER
# =========================================================

def fetch_jobicy() -> list[dict]:
    """
    Fetch jobs from Jobicy.

    Important:
    We do NOT deactivate existing jobs when they are missing
    from the current API response.
    """

    seen_ids = set()
    results = []

    for industry, tag in JOBICY_INDUSTRY_TAGS:

        params = {
            "count": JOBICY_COUNT,
            "industry": industry,
        }

        if tag:
            params["tag"] = tag

        try:
            response = requests.get(
                JOBICY_BASE,
                params=params,
                timeout=30,
                headers={
                    "User-Agent": "SwipeX-JobImporter/1.0"
                },
            )

            if response.status_code != 200:
                logger.warning(
                    "Jobicy %s/%s returned HTTP %s",
                    industry,
                    tag,
                    response.status_code,
                )
                continue

            data = response.json()

            jobs = data.get("jobs") or []

        except Exception as exc:
            logger.warning(
                "Jobicy error for %s/%s: %s",
                industry,
                tag,
                exc,
            )
            continue

        for job in jobs:

            source_id = str(
                job.get("id") or ""
            ).strip()

            if not source_id:
                continue

            if source_id in seen_ids:
                continue

            seen_ids.add(source_id)

            title = clean_text(
                job.get("jobTitle"),
                255,
            )

            company = clean_text(
                job.get("companyName")
                or "Unknown",
                255,
            )

            location = clean_text(
                job.get("jobGeo")
                or "Remote",
                255,
            )

            description = clean_text(
                job.get("jobDescription")
                or job.get("jobExcerpt")
                or "",
                4000,
            )

            job_types = job.get("jobType") or []

            level = job.get("jobLevel") or ""

            skills = build_skills(
                industry,
                tag,
                title,
                description,
                max_length=500,
            )

            application_url = str(
                job.get("url") or ""
            )[:1000]

            # -------------------------------------------------
            # Skip jobs that cannot be applied to
            # -------------------------------------------------

            if not application_url:
                continue

            results.append(
                {
                    "source": "jobicy",
                    "source_id": source_id,
                    "title": title,
                    "company": company,
                    "location": location,
                    "work_mode": map_work_mode(
                        job_types,
                        location,
                    ),
                    "salary": "",
                    "experience": map_level(level),
                    "description": description,
                    "required_skills": skills,
                    "application_url": application_url,
                    "posted_at": parse_iso(
                        job.get("pubDate")
                    ),
                    "expires_at": None,
                }
            )

    return results


# =========================================================
# REMOTEOK FETCHER
# =========================================================

def fetch_remoteok() -> list[dict]:
    """
    Fetch jobs from RemoteOK.

    Important:
    We do NOT deactivate existing jobs when they are missing
    from the current API response.
    """

    try:
        response = requests.get(
            REMOTEOK_URL,
            timeout=30,
            headers={
                "User-Agent": "SwipeX-JobImporter/1.0",
                "Accept": "application/json",
            },
        )

        if response.status_code != 200:
            logger.warning(
                "RemoteOK returned HTTP %s",
                response.status_code,
            )
            return []

        data = response.json()

    except Exception as exc:
        logger.warning(
            "RemoteOK error: %s",
            exc,
        )
        return []

    results = []
    seen_ids = set()

    # RemoteOK first item is API metadata.
    for job in data[1:]:

        source_id = str(
            job.get("id")
            or job.get("slug")
            or ""
        ).strip()

        if not source_id:
            continue

        if source_id in seen_ids:
            continue

        seen_ids.add(source_id)

        title = clean_text(
            job.get("position"),
            255,
        )

        company = clean_text(
            job.get("company")
            or "Unknown",
            255,
        )

        description = clean_text(
            job.get("description")
            or "",
            4000,
        )

        tags = job.get("tags") or []

        tags_text = ", ".join(
            str(tag)
            for tag in tags
        )

        skills = build_skills(
            tags_text,
            title,
            description,
            max_length=500,
        )

        application_url = (
            job.get("url")
            or job.get("apply_url")
            or ""
        )

        application_url = str(
            application_url
        )[:1000]

        # -------------------------------------------------
        # Skip jobs that cannot be applied to
        # -------------------------------------------------

        if not application_url:
            continue

        results.append(
            {
                "source": "remoteok",
                "source_id": source_id,
                "title": title,
                "company": company,
                "location": "Remote",
                "work_mode": "Remote",
                "salary": "",
                "experience": map_level(
                    job.get("level") or ""
                ),
                "description": description,
                "required_skills": skills,
                "application_url": application_url,
                "posted_at": parse_iso(
                    job.get("date")
                ),
                "expires_at": None,
            }
        )

    return results


# =========================================================
# MANAGEMENT COMMAND
# =========================================================

class Command(BaseCommand):

    help = (
        "Fetch fresh technical and non-technical jobs "
        "from Jobicy and RemoteOK."
    )

    # -----------------------------------------------------
    # COMMAND ARGUMENTS
    # -----------------------------------------------------

    def add_arguments(self, parser):

        parser.add_argument(
            "--dry-run",
            action="store_true",
            help=(
                "Fetch and count jobs without "
                "saving them."
            ),
        )

        parser.add_argument(
            "--source",
            choices=[
                "jobicy",
                "remoteok",
                "all",
            ],
            default="all",
            help="Choose the job source.",
        )

    # -----------------------------------------------------
    # MAIN COMMAND
    # -----------------------------------------------------

    def handle(self, *args, **options):

        dry_run = options["dry_run"]

        source_filter = options["source"]

        now = dj_tz.now()

        all_jobs = []

        # =================================================
        # JOBICY
        # =================================================

        if source_filter in (
            "jobicy",
            "all",
        ):

            self.stdout.write(
                "Fetching technical and "
                "non-technical jobs from Jobicy..."
            )

            jobicy_jobs = fetch_jobicy()

            self.stdout.write(
                f"  → {len(jobicy_jobs)} "
                f"Jobicy jobs fetched"
            )

            all_jobs.extend(jobicy_jobs)

        # =================================================
        # REMOTEOK
        # =================================================

        if source_filter in (
            "remoteok",
            "all",
        ):

            self.stdout.write(
                "Fetching jobs from RemoteOK..."
            )

            remoteok_jobs = fetch_remoteok()

            self.stdout.write(
                f"  → {len(remoteok_jobs)} "
                f"RemoteOK jobs fetched"
            )

            all_jobs.extend(remoteok_jobs)

        # =================================================
        # REMOVE EXPIRED JOBS FROM CURRENT FETCH
        # =================================================

        active_jobs = []

        expired_count = 0

        for job in all_jobs:

            expires_at = job.get(
                "expires_at"
            )

            if (
                expires_at
                and expires_at < now
            ):
                expired_count += 1
                continue

            active_jobs.append(job)

        # =================================================
        # SUMMARY
        # =================================================

        self.stdout.write(
            f"Total fetched: {len(all_jobs)} | "
            f"Expired skipped: {expired_count} | "
            f"To upsert: {len(active_jobs)}"
        )

        # =================================================
        # DRY RUN
        # =================================================

        if dry_run:

            self.stdout.write(
                self.style.WARNING(
                    "Dry-run mode — no database "
                    "changes made."
                )
            )

            return

        # =================================================
        # UPSERT JOBS
        # =================================================

        created = 0
        updated = 0
        skipped = 0

        with transaction.atomic():

            for job in active_jobs:

                source = job["source"]

                source_id = job["source_id"]

                try:

                    _, was_created = (
                        Job.objects.update_or_create(
                            source=source,
                            source_id=source_id,
                            defaults={
                                "title": job["title"],
                                "company": job["company"],
                                "location": job["location"],
                                "work_mode": job["work_mode"],
                                "salary": job["salary"],
                                "experience": job["experience"],
                                "description": job["description"],
                                "required_skills": job[
                                    "required_skills"
                                ],
                                "application_url": job[
                                    "application_url"
                                ],
                                "posted_at": job[
                                    "posted_at"
                                ],
                                "expires_at": job[
                                    "expires_at"
                                ],

                                # A job returned by the
                                # source is active.
                                "is_active": True,

                                "min_ats": 50,
                            },
                        )
                    )

                    if was_created:
                        created += 1
                    else:
                        updated += 1

                except Exception as exc:

                    logger.warning(
                        "Could not save %s/%s: %s",
                        source,
                        source_id,
                        exc,
                    )

                    skipped += 1

        # =================================================
        # IMPORTANT:
        # DO NOT DEACTIVATE STALE JOBS
        # =================================================

        self.stdout.write(
            self.style.WARNING(
                "Skipping stale Jobicy/RemoteOK "
                "deactivation."
            )
        )

        # =================================================
        # FINAL DATABASE COUNT
        # =================================================

        total_active = Job.objects.filter(
            is_active=True
        ).count()

        # =================================================
        # FINAL OUTPUT
        # =================================================

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Created: {created} | "
                f"Updated: {updated} | "
                f"Skipped errors: {skipped}"
            )
        )

        self.stdout.write(
            f"Total active jobs in DB: {total_active}"
        )