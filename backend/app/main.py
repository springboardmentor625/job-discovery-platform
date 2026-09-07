from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine
from .models import Base

from .routers import auth
from .routers import resume
from .routers import ats
from .routers import jobs
from .routers import recommendations
from .routers import swipes
from .routers import applications
from .routers import dashboard
from .routers import profile


# =========================================================
# CREATE DATABASE TABLES
# =========================================================

Base.metadata.create_all(
    bind=engine
)


# =========================================================
# CREATE FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="SwipeX API",
    description=(
        "SwipeX - Swipe-Based Intelligent "
        "Job Discovery and Career Assistance Platform"
    ),
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

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


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "message": "SwipeX Backend is running successfully"
    }


# =========================================================
# ROUTERS
# =========================================================

app.include_router(
    auth.router
)

app.include_router(
    resume.router
)

app.include_router(
    ats.router
)

app.include_router(
    jobs.router
)

app.include_router(
    recommendations.router
)

app.include_router(
    swipes.router
)

app.include_router(
    applications.router
)

app.include_router(
    dashboard.router
)

app.include_router(
    profile.router
)
