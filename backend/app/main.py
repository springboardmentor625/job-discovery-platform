from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.config import get_settings
from app.database import Base, engine
from app.models import CandidateProfile, User
from app.routers.auth import router as auth_router
from app.routers.candidate import router as candidate_router
settings = get_settings()
app = FastAPI(title="SwipeX API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
Base.metadata.create_all(bind=engine)
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.include_router(auth_router)
app.include_router(candidate_router, prefix="/api")
@app.get("/health")
def health_check():
    return {"status": "ok"}