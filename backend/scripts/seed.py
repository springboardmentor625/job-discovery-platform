import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.user import User, UserRole
from app.models.profile import Profile
from app.models.company import Company, VerificationStatus
from app.models.job import Job, JobStatus
from app.core.security import get_password_hash

def seed_db():
    db = SessionLocal()
    try:
        # Seed Recruiter
        recruiter_email = "recruiter@example.com"
        recruiter = db.query(User).filter(User.email == recruiter_email).first()
        if not recruiter:
            recruiter = User(
                email=recruiter_email,
                password_hash=get_password_hash("password123"),
                role=UserRole.recruiter,
                is_active=True
            )
            db.add(recruiter)
            db.commit()
            db.refresh(recruiter)
            print("Seeded recruiter.")

        # Seed Company
        company_name = "TechFlow Solutions"
        company = db.query(Company).filter(Company.company_name == company_name).first()
        if not company:
            company = Company(
                user_id=recruiter.user_id,
                company_name=company_name,
                industry="Information Technology",
                company_size="51-200",
                about="Leading tech solutions provider.",
                verification_status=VerificationStatus.approved
            )
            db.add(company)
            db.commit()
            db.refresh(company)
            print("Seeded company.")

        # Seed Jobs
        sample_jobs = [
            {
                "job_title": "Frontend Developer",
                "job_description": "We are looking for a skilled Frontend Developer proficient in React.",
                "required_skills": ["React", "TypeScript", "Tailwind CSS"],
                "experience_required": 2,
                "location": "Remote",
                "job_type": "Full-time",
                "salary_min": 80000,
                "salary_max": 120000
            },
            {
                "job_title": "Backend Developer",
                "job_description": "Seeking a Backend Developer with FastAPI and Postgres experience.",
                "required_skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
                "experience_required": 3,
                "location": "New York, NY",
                "job_type": "Full-time",
                "salary_min": 90000,
                "salary_max": 130000
            },
            {
                "job_title": "Data Analyst",
                "job_description": "Data Analyst needed to interpret complex datasets.",
                "required_skills": ["SQL", "Python", "Tableau", "Excel"],
                "experience_required": 1,
                "location": "San Francisco, CA",
                "job_type": "Contract",
                "salary_min": 70000,
                "salary_max": 90000
            },
            {
                "job_title": "AI Engineer",
                "job_description": "Build cutting-edge AI features using LLMs.",
                "required_skills": ["Python", "PyTorch", "OpenAI API", "Machine Learning"],
                "experience_required": 4,
                "location": "Remote",
                "job_type": "Full-time",
                "salary_min": 130000,
                "salary_max": 180000
            }
        ]

        for job_data in sample_jobs:
            existing_job = db.query(Job).filter(
                Job.job_title == job_data["job_title"],
                Job.company_id == company.company_id
            ).first()
            if not existing_job:
                job = Job(
                    recruiter_id=recruiter.user_id,
                    company_id=company.company_id,
                    status=JobStatus.active,
                    **job_data
                )
                db.add(job)
        db.commit()
        print("Seeded jobs.")

        # Seed Job Seeker
        seeker_email = "seeker@example.com"
        seeker = db.query(User).filter(User.email == seeker_email).first()
        if not seeker:
            seeker = User(
                email=seeker_email,
                password_hash=get_password_hash("password123"),
                role=UserRole.job_seeker,
                is_active=True
            )
            db.add(seeker)
            db.commit()
            db.refresh(seeker)
            
            profile = Profile(
                user_id=seeker.user_id,
                headline="Enthusiastic Full Stack Developer",
                skills=["Python", "React", "SQL"],
                experience_years=2
            )
            db.add(profile)
            db.commit()
            print("Seeded job seeker.")
            
        print("Database seeding completed successfully.")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
