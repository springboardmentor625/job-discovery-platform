"""
Async Kaggle CSV → jobs table seeder.

Run from the backend directory:
    python -m app.db.kaggle_seeder
    python -m app.db.kaggle_seeder backend/data/gsearch_jobs.csv --limit 1000
"""
from __future__ import annotations

import argparse
import ast
import asyncio
import os
import sys
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
from sqlalchemy import insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_maker, engine
from app.core.models import Job, User

SEEDER_EMAIL = "kaggle-seeder@swipex.local"
DATA_DIR = Path(__file__).resolve().parents[2] / "data"
DEFAULT_CSV = Path(
    os.environ.get("KAGGLE_JOBS_CSV")
    or (DATA_DIR / "gsearch_jobs.csv" if (DATA_DIR / "gsearch_jobs.csv").exists() else DATA_DIR / "kaggle_jobs.csv")
)
# Dummy hash so we never call passlib/bcrypt (incompatible bcrypt versions print noisy errors).
SEEDER_PASSWORD_HASH = "kaggle-seeder-disabled"


def _pick_column(columns: List[str], *candidates: str) -> Optional[str]:
    lowered = {str(c).strip().lower(): c for c in columns}
    for name in candidates:
        if name.lower() in lowered:
            return lowered[name.lower()]
    for name in candidates:
        prefix = name.lower()
        for key, original in lowered.items():
            if key.startswith(prefix):
                return original
    return None


def _cell(value: Any) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    text = str(value).strip()
    if text.lower() in {"nan", "none", "<na>"}:
        return ""
    return text


def _parse_description_tokens(raw: Any) -> List[str]:
    """Parse Kaggle description_tokens like \"['python', 'sql']\" into a Python list."""
    if isinstance(raw, list):
        values = raw
    else:
        text = _cell(raw)
        if not text:
            return []
        try:
            parsed = ast.literal_eval(text)
            values = list(parsed) if isinstance(parsed, (list, tuple, set)) else [text]
        except (ValueError, SyntaxError):
            values = [part.strip(" []'\"") for part in text.replace("|", ",").split(",")]

    cleaned: List[str] = []
    seen = set()
    for item in values:
        skill = str(item).strip().strip("'\"")
        key = skill.lower()
        if skill and key not in seen:
            seen.add(key)
            cleaned.append(skill)
        if len(cleaned) >= 40:
            break
    return cleaned


def _load_job_payloads(csv_path: Path, recruiter_id: uuid.UUID, limit: int) -> List[Dict[str, Any]]:
    df = pd.read_csv(csv_path, nrows=max(limit * 3, limit))
    title_col = _pick_column(list(df.columns), "title", "job_title")
    company_col = _pick_column(list(df.columns), "company_name", "company_", "company")
    location_col = _pick_column(list(df.columns), "location", "job_location")
    description_col = _pick_column(list(df.columns), "description", "job_description")
    tokens_col = _pick_column(list(df.columns), "description_tokens", "required_skills", "skills")

    if not title_col or not company_col:
        raise ValueError(f"CSV is missing title/company columns. Found: {list(df.columns)}")

    payloads: List[Dict[str, Any]] = []
    seen = set()
    for _, row in df.iterrows():
        title = _cell(row.get(title_col))
        company = _cell(row.get(company_col))
        if not title or not company:
            continue
        key = (title.lower(), company.lower())
        if key in seen:
            continue
        seen.add(key)

        location = _cell(row.get(location_col)) if location_col else ""
        description = _cell(row.get(description_col)) if description_col else ""
        if not description:
            description = f"{title} at {company}."
        skills = _parse_description_tokens(row.get(tokens_col) if tokens_col else None)

        payloads.append({
            "id": uuid.uuid4(),
            "recruiter_id": recruiter_id,
            "title": title[:200],
            "company_name": company[:150],
            "location": location[:150] if location else None,
            "description": description[:20000],
            "required_skills": skills,
            "is_active": True,
        })
        if len(payloads) >= limit:
            break
    return payloads


async def _get_or_create_seeder_recruiter(db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.email == SEEDER_EMAIL))
    user = result.scalars().first()
    if user:
        return user

    user = User(
        email=SEEDER_EMAIL,
        password_hash=SEEDER_PASSWORD_HASH,
        role="recruiter",
    )
    db.add(user)
    await db.flush()
    return user


async def seed_kaggle_jobs(csv_path: Path, limit: int = 1000, batch_size: int = 100) -> int:
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    inserted = 0
    async with async_session_maker() as db:
        recruiter = await _get_or_create_seeder_recruiter(db)
        payloads = _load_job_payloads(csv_path, recruiter.id, limit)

        for start in range(0, len(payloads), batch_size):
            batch = payloads[start:start + batch_size]
            await db.execute(insert(Job), batch)
            inserted += len(batch)

        await db.commit()
    return inserted


async def _main(csv_path: Optional[str], limit: int) -> None:
    path = Path(csv_path) if csv_path else DEFAULT_CSV
    try:
        total = await seed_kaggle_jobs(path, limit=limit)
        print(f"Seeded {total} jobs from {path}")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    if sys.platform.startswith("win"):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    parser = argparse.ArgumentParser(description="Seed SwipeX jobs from a Kaggle CSV")
    parser.add_argument("csv", nargs="?", default=None, help="Path to the jobs CSV")
    parser.add_argument("--limit", type=int, default=1000, help="Max rows to insert")
    args = parser.parse_args()
    asyncio.run(_main(args.csv, args.limit))
