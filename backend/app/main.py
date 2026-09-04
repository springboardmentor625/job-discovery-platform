from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from . import models

from .routes.auth_routes import router as auth_router
from .routes.candidate_routes import router as candidate_router
from .routes.resume_routes import router as resume_router
from .routes.job_routes import router as job_router
from .routes.saved_job_routes import router as saved_job_router
from .routes.recommendation_routes import router as recommendation_router
from .routes.ats_routes import router as ats_router


# ==========================================
# CREATE DATABASE TABLES
# ==========================================

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
        "http://localhost:5173",
        "http://127.0.0.1:5173"
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