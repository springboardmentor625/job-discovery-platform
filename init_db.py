#!/usr/bin/env python3
"""
Database initialization script for SwipeX
This script creates all database tables using SQLAlchemy models.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app.database import engine, Base
from app import models

def init_db():
    """Initialize the database by creating all tables"""
    print("🔧 Initializing SwipeX database...")
    print(f"📍 Database URL: {os.getenv('DATABASE_URL', 'postgresql://postgres:Amma1434@localhost:5432/swipedb')}")
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
        
        # List created tables
        print("\n📋 Tables in database:")
        tables = [
            "users",
            "candidate_profile", 
            "companies",
            "jobs",
            "resumes",
            "applications",
            "swipe_history",
            "notifications",
            "recommendations",
            "ats_reports"
        ]
        for table in tables:
            print(f"   ✓ {table}")
        
        print("\n✨ Database initialization complete!")
        print("You can now run: uvicorn app.main:app --reload")
        return True
        
    except Exception as e:
        print(f"❌ Error initializing database: {str(e)}")
        print("\n💡 Troubleshooting tips:")
        print("   1. Ensure PostgreSQL is running")
        print("   2. Check your DATABASE_URL in .env file")
        print("   3. Verify database credentials are correct")
        return False

if __name__ == "__main__":
    success = init_db()
    sys.exit(0 if success else 1)
