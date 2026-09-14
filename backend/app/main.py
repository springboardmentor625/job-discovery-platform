from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.database.session import get_db
from app.api.v1 import auth, jobs, applications, swipes, companies, resumes, saved_jobs, profiles, dashboard

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_V1_STR + "/auth", tags=["auth"])
app.include_router(jobs.router, prefix=settings.API_V1_STR + "/jobs", tags=["jobs"])
app.include_router(applications.router, prefix=settings.API_V1_STR + "/applications", tags=["applications"])
app.include_router(swipes.router, prefix=settings.API_V1_STR + "/swipes", tags=["swipes"])
app.include_router(companies.router, prefix=settings.API_V1_STR + "/companies", tags=["companies"])
app.include_router(resumes.router, prefix=settings.API_V1_STR + "/resumes", tags=["resumes"])
app.include_router(saved_jobs.router, prefix=settings.API_V1_STR + "/saved_jobs", tags=["saved_jobs"])
app.include_router(profiles.router, prefix=settings.API_V1_STR + "/profiles", tags=["profiles"])
app.include_router(dashboard.router, prefix=settings.API_V1_STR + "/dashboard", tags=["dashboard"])

@app.get("/")
def root():
    return {"message": "Welcome to SwipeX API"}

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Check database connection
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        # Avoid leaking exact credentials, just report unhealthy
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e)
            }
        )

