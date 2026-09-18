from sqlalchemy import inspect, text

from . import models  # noqa: F401 — import registers ORM classes on Base.metadata,
                       # which sync_missing_columns() below needs to know the full
                       # current schema.
from .database import Base


LEGACY_EXPERIENCE_YEARS = {
    "intern": 0,
    "internship": 0,
    "trainee": 0,
    "fresher": 0,
    "entry level": 0,
    "entry-level": 0,
    "fresher / entry-level": 0,
    "junior": 1,
    "associate": 1,
    "junior / associate": 1,
    "mid-level": 3,
    "mid level": 3,
    "senior": 6,
    "senior-level": 6,
    "lead": 8,
    "manager": 10,
    "experienced professional": 5,
}


def legacy_experience_years(value):
    if value is None:
        return None
    normalized = " ".join(str(value).strip().lower().split())
    return LEGACY_EXPERIENCE_YEARS.get(normalized)


def sync_missing_columns(engine):
    """Add any model column that's missing from an EXISTING table.

    `Base.metadata.create_all()` only creates tables that don't exist yet
    — it never alters a table that's already there, so a column added to
    a SQLAlchemy model after a database was first created (e.g. this
    project's newer `jobs.company_type`, `jobs.preferred_skills`,
    `job_swipes.match_score`, and the `ats_reports` score columns) would
    otherwise silently never appear on an existing database, and every
    request touching that column would fail at the DB layer.

    This walks every mapped model, and for tables that already exist,
    adds (as plain nullable columns — nullable so no existing row needs
    backfilling, since ALTER TABLE ... ADD COLUMN ... NOT NULL would fail
    on a non-empty table without a default) any column present in the
    model but absent from the live table. It never touches a table that
    doesn't exist yet (create_all handles brand-new tables) and never
    modifies or drops an existing column, so no data is ever at risk.

    Safe to call every startup: columns that already exist are left
    untouched, and a table with no missing columns is a no-op.
    """
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    with engine.begin() as connection:
        for table in Base.metadata.sorted_tables:
            if table.name not in existing_tables:
                # Brand-new table — Base.metadata.create_all() (called
                # right after this) creates it with every current
                # column already, so there's nothing to add here.
                continue

            existing_columns = {
                column["name"] for column in inspector.get_columns(table.name)
            }

            for column in table.columns:
                if column.name in existing_columns:
                    continue

                # Every nullable=False column in this project's models
                # also has a Python-side default (e.g. status="active")
                # rather than a DB-side server_default, so a freshly
                # ALTERed column is added nullable regardless of the
                # model's own nullable setting — that's the only way to
                # add it to a table that may already have rows, without
                # either failing outright or guessing a backfill value.
                column_type = column.type.compile(dialect=engine.dialect)
                connection.execute(
                    text(
                        f'ALTER TABLE "{table.name}" '
                        f'ADD COLUMN "{column.name}" {column_type}'
                    )
                )
                print(
                    f"[migration] Added missing column "
                    f"{table.name}.{column.name} ({column_type})"
                )


def migrate_candidate_experience(engine):
    """Add and backfill the numeric profile field without deleting old data."""
    inspector = inspect(engine)
    if "candidate_profiles" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("candidate_profiles")}
    with engine.begin() as connection:
        if "experience_years" not in columns:
            connection.execute(
                text("ALTER TABLE candidate_profiles ADD COLUMN experience_years INTEGER")
            )

        connection.execute(
            text(
                "UPDATE candidate_profiles "
                "SET experience_years = CAST(ROUND(experience_years) AS INTEGER) "
                "WHERE experience_years IS NOT NULL"
            )
        )

        if "experience" in columns:
            for label, years in LEGACY_EXPERIENCE_YEARS.items():
                connection.execute(
                    text(
                        "UPDATE candidate_profiles "
                        "SET experience_years = :years "
                        "WHERE experience_years IS NULL "
                        "AND LOWER(TRIM(experience)) = :label"
                    ),
                    {"years": years, "label": label},
                )