import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database.base import Base
from app.database.session import get_db

# We can use an in-memory SQLite database for fast unit testing of the API
# but for the exact assignment we need to test Postgres if it's available.
# We'll use the main DB URL, which will fail if DB is not running, matching the prompt's request to "Test Database Connection"

client = TestClient(app)

def test_health_check():
    """
    Test the health check endpoint to verify database connection.
    This will fail if PostgreSQL is not running and configured correctly.
    """
    response = client.get("/health")
    
    # Asserting that it returns 200 and healthy status
    # If the DB is down, it returns 503.
    assert response.status_code == 200, f"Health check failed: {response.json()}"
    assert response.json()["status"] == "healthy"
    assert response.json()["database"] == "connected"

def test_register_user_persistence():
    """
    Test user registration persists in the database.
    """
    test_user = {
        "email": "test_user_db_persistence@example.com",
        "password": "securepassword",
        "role": "JobSeeker"
    }
    
    # Register
    response = client.post("/api/v1/auth/register", json=test_user)
    
    # It might return 400 if user already exists from a previous test run
    if response.status_code == 200:
        assert response.json()["email"] == test_user["email"]
    else:
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]
        
def test_login_database_lookup():
    """
    Test login retrieves user from DB.
    """
    login_data = {
        "username": "test_user_db_persistence@example.com",
        "password": "securepassword"
    }
    response = client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 200
    assert "access_token" in response.json()
