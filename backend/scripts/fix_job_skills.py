# ==========================================
# BACKFILL: fix skills on jobs already in the database
#
# Use this INSTEAD OF re-running import_jobs.py if jobs are already
# imported. Re-importing means DELETE FROM jobs first, which would
# orphan any JobSwipe, SavedJob, or ATSReport rows referencing those
# job_id values. This script updates skills IN PLACE, leaving job_id
# (and everything that references it) untouched.
#
# Extracts from TITLE + DESCRIPTION combined — titles often carry
# clear skill signal ("Senior Java Developer") even when the full
# description is too vague on its own, which is why some jobs ended
# up with empty skills from earlier extraction passes that used
# description alone.
#
# Usage:
#   python scripts/fix_job_skills.py --only-empty     # just the broken ones
#   python scripts/fix_job_skills.py --only-empty --no-llm   # fast, no Groq
#   python scripts/fix_job_skills.py --limit 500              # sample first
# ==========================================

import os
import sys
import time
import argparse

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import Job
from app.services.resume_parser import extract_skills

DEFAULT_RPM = 25


def fix_job_skills(limit=0, only_empty=False, use_llm=True, rpm=DEFAULT_RPM):
    if not use_llm:
        os.environ["GROQ_API_KEY"] = ""
        print("--no-llm set: dictionary + spaCy extraction only, no Groq calls.")
    else:
        print(f"Groq enabled, throttled to {rpm} requests/min.")

    db = SessionLocal()
    started_at = time.time()

    try:
        query = db.query(Job).filter(Job.status == "active")

        if only_empty:
            query = query.filter((Job.skills == None) | (Job.skills == ""))  # noqa: E711

        if limit and limit > 0:
            query = query.limit(limit)

        jobs = query.all()
        total = len(jobs)

        print(f"Re-extracting skills for {total} job(s)...")

        updated = 0
        still_empty = 0
        insufficient_text = 0
        sample_still_empty = []

        for i, job in enumerate(jobs):
            title_text = (job.title or "").strip()
            description_text = (job.description or "").strip()
            extraction_text = f"{title_text}. {description_text}"

            # ======================================
            # DIAGNOSTIC: is there even enough text to
            # extract from? If title+description is
            # suspiciously short, that's a DATA problem
            # (blank/stub job postings), not an
            # extraction bug — worth telling apart.
            # ======================================
            if len(extraction_text.strip()) < 20:
                insufficient_text += 1

            new_skills = extract_skills(extraction_text)

            if use_llm:
                time.sleep(60.0 / rpm)

            if new_skills != job.skills:
                job.skills = new_skills
                updated += 1

            if not new_skills:
                still_empty += 1
                if len(sample_still_empty) < 5:
                    sample_still_empty.append(
                        (job.job_id, title_text[:60], description_text[:100])
                    )

            if (i + 1) % 100 == 0:
                elapsed = time.time() - started_at
                print(f"  ...{i + 1}/{total} processed ({elapsed:.0f}s elapsed)")
                db.commit()

        db.commit()

        print("\n================================")
        print("SKILL BACKFILL COMPLETED")
        print("================================")
        print(f"Jobs processed    : {total}")
        print(f"Jobs updated      : {updated}")
        print(f"Still empty       : {still_empty}")
        print(f"  ...of which had < 20 chars of title+description text: {insufficient_text}")
        print(f"Total time        : {time.time() - started_at:.0f}s")

        if insufficient_text > still_empty * 0.5:
            print(
                "\n⚠️  Most 'still empty' jobs have almost no title/description "
                "text at all — this is a DATA problem (blank/stub postings in "
                "the source CSV), not an extraction bug. No skill extractor "
                "can find skills in text that isn't there."
            )

        if sample_still_empty:
            print("\nSample of jobs that stayed empty (job_id, title, description):")
            for job_id, title, desc in sample_still_empty:
                print(f"  [{job_id}] title={title!r} description={desc!r}")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Backfill real skills onto existing jobs, in place.")
    parser.add_argument("--limit", type=int, default=0, help="Max jobs to process (0 = all).")
    parser.add_argument("--only-empty", action="store_true", help="Only process jobs whose skills field is currently blank.")
    parser.add_argument("--no-llm", action="store_true", help="Skip Groq entirely — dictionary/spaCy extraction only.")
    parser.add_argument("--rpm", type=int, default=DEFAULT_RPM, help=f"When Groq is enabled, max requests/minute (default {DEFAULT_RPM}).")
    args = parser.parse_args()
    fix_job_skills(limit=args.limit, only_empty=args.only_empty, use_llm=not args.no_llm, rpm=args.rpm)
