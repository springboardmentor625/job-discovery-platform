# scripts/seed_db.py
import asyncio
import random
from faker import Faker
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext

# Import your database and models
from app.core.database import async_session_maker
from app.core.models import User, RecruiterProfile, Job
from app.services.ai.embedder import vector_engine
from app.utils.logger import swipex_logger

fake = Faker()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pre-defined realistic tech stacks to make the AI embeddings accurate
TECH_ROLES = [
    {"title": "Machine Learning Engineer", "skills": ["Python", "PyTorch", "TensorFlow", "AWS"]},
    {"title": "Data Scientist", "skills": ["Python", "Pandas", "SQL", "Scikit-Learn"]},
    {"title": "Backend Developer", "skills": ["Python", "FastAPI", "PostgreSQL", "Docker"]},
    {"title": "AI Researcher", "skills": ["Deep Learning", "NLP", "Transformers", "Python"]}
]

async def seed_database():
    swipex_logger.info("Starting database seeding process...")
    
    async with async_session_maker() as db:
        try:
            # 1. Create 5 Fake Recruiters
            recruiters = []
            for i in range(5):
                # Create the User account
                user = User(
                    email=f"recruiter{i}@fakecompany.com",
                    password_hash=pwd_context.hash("password123"),
                    role="recruiter"
                )
                db.add(user)
                await db.flush() # Flush to get the UUID instantly
                
                # Create the Recruiter Profile
                profile = RecruiterProfile(
                    user_id=user.id,
                    company_name=fake.company(),
                    industry="Technology",
                    website=fake.url()
                )
                db.add(profile)
                recruiters.append((user.id, profile.company_name))
            
            swipex_logger.success("Generated 5 Fake Recruiters.")
            
            # 2. Create 50 Fake Jobs with AI Vectors
            swipex_logger.info("Generating 50 jobs and calculating AI vectors. This might take a minute...")
            
            for _ in range(50):
                recruiter_id, company_name = random.choice(recruiters)
                role = random.choice(TECH_ROLES)
                
                # Generate a realistic-looking job description
                description = f"We are {company_name}, looking for a {role['title']}. You will work on cutting-edge systems. Requirements: {', '.join(role['skills'])}. {fake.paragraph(nb_sentences=3)}"
                
                # Trigger Sentence-Transformers to create the pgvector embedding!
                job_vector = vector_engine.get_embedding(description)
                
                job = Job(
                    recruiter_id=recruiter_id,
                    title=role["title"],
                    company_name=company_name,
                    description=description,
                    required_skills=role["skills"],
                    embedding=job_vector,
                    is_active=True
                )
                db.add(job)
            
            # Commit everything to PostgreSQL
            await db.commit()
            swipex_logger.success("Successfully injected 50 AI-vectorized jobs into the database!")
            
        except Exception as e:
            await db.rollback()
            swipex_logger.error(f"Seeding failed: {str(e)}")
            raise

if __name__ == "__main__":
    # Execute the async function
    asyncio.run(seed_database())