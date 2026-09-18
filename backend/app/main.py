import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from . import models
from .migrations import migrate_candidate_experience, sync_missing_columns

from .routes.auth_routes import router as auth_router
from .routes.candidate_routes import router as candidate_router
from .routes.resume_routes import router as resume_router
from .routes.job_routes import router as job_router
from .routes.saved_job_routes import router as saved_job_router
from .routes.recommendation_routes import router as recommendation_router
from .routes.ats_routes import router as ats_router


# ==========================================
# CREATE / MIGRATE DATABASE TABLES
#
# Order matters: both migration steps run against whatever tables
# already exist BEFORE create_all() runs. On a fresh database neither
# step finds any existing tables, so both are no-ops and create_all()
# alone creates every table with every current column. On an existing
# database, sync_missing_columns() generically adds any column present
# in the current models but missing from that table (e.g. a column
# added since that database was first created), then
# migrate_candidate_experience() runs its extra one-off backfill logic
# for candidate_profiles.experience_years specifically (converting old
# float/text experience values into the numeric column) — it sees the
# column already exists by this point and only backfills. Either way,
# create_all() runs last and only ever creates whole tables that don't
# exist yet; it never touches or drops existing ones.
# ==========================================

sync_missing_columns(engine)
migrate_candidate_experience(engine)

Base.metadata.create_all(
    bind=engine
)


# ==========================================
# FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="SwipeX API"
)


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ==========================================
# ROUTES
# ==========================================

app.include_router(
    auth_router
)

app.include_router(
    candidate_router
)
app.include_router(
    saved_job_router
)
app.include_router(
    resume_router
)

app.include_router(
    job_router
)

app.include_router(
    recommendation_router
)

app.include_router(
    ats_router
)


# ==========================================
# ROOT
# ==========================================

@app.get("/")
def root():

    return {
        "message": "SwipeX backend is running"
    }