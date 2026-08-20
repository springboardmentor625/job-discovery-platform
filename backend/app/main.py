from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .database import engine
from .routers import auth


app = FastAPI(
    title="SwipeX API",
    description="Backend API for SwipeX - Swipe-Based Intelligent Job Discovery and Career Assistance Platform",
    version="1.0.0"
)


# Allow React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)


@app.get("/")
def root():
    return {
        "message": "SwipeX Backend is running"
    }


@app.get("/test-db")
def test_database():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("SELECT current_database()")
            )

            database_name = result.scalar()

        return {
            "status": "success",
            "message": "PostgreSQL connection successful",
            "database": database_name
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }