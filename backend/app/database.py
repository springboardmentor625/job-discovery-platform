import os

from dotenv import load_dotenv

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


# Load .env
load_dotenv()


# PostgreSQL connection URL
DATABASE_URL = os.getenv("DATABASE_URL")


# Check whether DATABASE_URL was loaded
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set in the .env file"
    )


# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)


# Create database session
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# Base class for database models
Base = declarative_base()


# Dependency for FastAPI routes
def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()