# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine
from app.api.v1.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Do not preload HuggingFace models — job ranking uses sklearn TF-IDF only.
    yield
    await engine.dispose()

# Initialize the FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise AI Job Matching Platform for Infosys Springboard",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Security Configuration (Allows React to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the Master API Router
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def health_check():
    return {
        "status": "online", 
        "engine": "SwipeX AI Core", 
        "message": "System is running at optimal capacity."
    }
