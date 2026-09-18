# app/api/v1/api.py
from fastapi import APIRouter

from app.api.v1.endpoints import auth, candidates, recruiters, swipes
from app.api.v1.endpoints import jobs

api_router = APIRouter()

# Wire up the individual endpoint files we just built
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(candidates.router, prefix="/candidates", tags=["Candidate Profiles"])
api_router.include_router(recruiters.router, prefix="/recruiters", tags=["Recruiter Dashboard"])
api_router.include_router(swipes.router, prefix="/swipes", tags=["AI Swipe Engine"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])