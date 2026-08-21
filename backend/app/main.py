import json
import re
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Generator, Optional

from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
import bcrypt
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, create_engine, func, inspect, select, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker


class Settings(BaseSettings):
    database_url: str = "sqlite:///./swipex.db"
    jwt_secret: str = "change-this-in-production"
    jwt_expire_minutes: int = 60
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    ai_api_key: Optional[str] = None
    ai_api_url: str = "https://api.openai.com/v1/chat/completions"
    ai_model: str = "gpt-4o-mini"
    ai_timeout_seconds: int = 20
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
ALGORITHM = "HS256"


class Base(DeclarativeBase):
    pass


class Role(str, Enum):
    seeker = "seeker"
    recruiter = "recruiter"
    interviewer = "interviewer"
    admin = "admin"


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(30), default=Role.seeker.value)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class Job(Base):
    __tablename__ = "jobs"
    id: Mapped[int] = mapped_column(primary_key=True)
    recruiter_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(160))
    company: Mapped[str] = mapped_column(String(160))
    company_type: Mapped[str] = mapped_column(String(40), default="Startup")
    location: Mapped[str] = mapped_column(String(120))
    job_type: Mapped[str] = mapped_column(String(40), default="Full-time")
    salary_min: Mapped[int] = mapped_column(Integer, default=0)
    salary_max: Mapped[int] = mapped_column(Integer, default=0)
    skills_json: Mapped[str] = mapped_column(Text, default="[]")
    description: Mapped[str] = mapped_column(Text)
    posted_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Application(Base):
    __tablename__ = "applications"
    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"))
    seeker_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(30), default="Applied")
    match_score: Mapped[float] = mapped_column(Float, default=0)
    reviewer_notes: Mapped[str] = mapped_column(Text, default="")
    reviewer_score: Mapped[float] = mapped_column(Float, nullable=True)
    interview_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class SavedJob(Base):
    __tablename__ = "saved_jobs"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class Swipe(Base):
    __tablename__ = "swipes"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"))
    decision: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class Activity(Base):
    __tablename__ = "activities"
    id: Mapped[int] = mapped_column(primary_key=True)
    actor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(120))
    entity_type: Mapped[str] = mapped_column(String(50))
    entity_id: Mapped[int] = mapped_column(Integer, nullable=True)
    metadata_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(180))
    detail: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class Profile(Base):
    __tablename__ = "profiles"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    data_json: Mapped[str] = mapped_column(Text, default="{}")
    resume_json: Mapped[str] = mapped_column(Text, default="{}")


class ATSReport(Base):
    __tablename__ = "ats_reports"
    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), nullable=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"))
    seeker_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    ats_score: Mapped[float] = mapped_column(Float, default=0.0)
    matched_skills_json: Mapped[str] = mapped_column(Text, default="[]")
    missing_skills_json: Mapped[str] = mapped_column(Text, default="[]")
    extracted_keywords_json: Mapped[str] = mapped_column(Text, default="[]")
    suggestions_json: Mapped[str] = mapped_column(Text, default="[]")
    workflow_steps_json: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class CandidateSkillDNA(Base):
    __tablename__ = "candidate_skill_dna"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    category: Mapped[str] = mapped_column(String(50), default="Technical")  # Technical, Domain, Soft, Tooling
    skill_name: Mapped[str] = mapped_column(String(100), index=True)
    proficiency_level: Mapped[int] = mapped_column(Integer, default=3)  # 1 (Beginner) to 5 (Expert)
    years_experience: Mapped[float] = mapped_column(Float, default=1.0)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_confidence_score: Mapped[float] = mapped_column(Float, default=0.85)
    endorsements_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class SkillEndorsement(Base):
    __tablename__ = "skill_endorsements"
    id: Mapped[int] = mapped_column(primary_key=True)
    skill_dna_id: Mapped[int] = mapped_column(ForeignKey("candidate_skill_dna.id"), index=True)
    endorser_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    comment: Mapped[str] = mapped_column(Text, default="")
    rating: Mapped[int] = mapped_column(Integer, default=5)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


Base.metadata.create_all(bind=engine)


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8)
    role: Role = Role.seeker


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class JobIn(BaseModel):
    title: str
    company: str
    company_type: str = "Startup"
    location: str
    job_type: str = "Full-time"
    salary_min: int = 0
    salary_max: int = 0
    skills: list[str] = []
    description: str


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    company: str
    company_type: str
    location: str
    job_type: str
    salary_min: int
    salary_max: int
    skills: list[str]
    description: str
    posted_at: datetime
    applicants_count: int = 0
    competition_level: str = "Low"
    is_early_applicant: bool = True
    match_score: float = 0
    matched_skills: list[str] = []
    missing_skills: list[str] = []


class SwipeIn(BaseModel):
    job_id: int
    decision: str = Field(pattern="^(left|right|save)$")


class StatusIn(BaseModel):
    status: str = Field(pattern="^(Applied|Viewed|Shortlisted|Interview|Rejected|Offer)$")
    notes: str = ""
    reviewer_score: Optional[float] = Field(default=None, ge=0, le=100)
    interview_at: Optional[datetime] = None


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime


class ApplicationOut(BaseModel):
    id: int
    job_id: int
    job_title: str
    company: str
    seeker_id: int
    seeker_name: str
    seeker_email: str
    status: str
    match_score: float
    reviewer_score: Optional[float]
    reviewer_notes: str
    interview_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ATSReportOut(BaseModel):
    id: int
    application_id: Optional[int] = None
    job_id: int
    job_title: str
    company: str
    seeker_id: int
    seeker_name: str
    ats_score: float
    matched_skills: list[str]
    missing_skills: list[str]
    extracted_keywords: list[str]
    suggestions: list[str]
    workflow_steps: list[dict]
    created_at: datetime


class ATSWorkflowIn(BaseModel):
    job_id: int
    application_id: Optional[int] = None


class SkillDNAIn(BaseModel):
    category: str = Field(default="Technical", description="Category: Technical, Domain, Soft, Tooling")
    skill_name: str = Field(min_length=1, max_length=100)
    proficiency_level: int = Field(default=3, ge=1, le=5)
    years_experience: float = Field(default=1.0, ge=0.0)


class SkillDNAOut(BaseModel):
    id: int
    user_id: int
    category: str
    skill_name: str
    proficiency_level: int
    years_experience: float
    verified: bool
    ai_confidence_score: float
    endorsements_count: int
    created_at: datetime


class SkillEndorsementIn(BaseModel):
    rating: int = Field(default=5, ge=1, le=5)
    comment: str = ""


class SkillEndorsementOut(BaseModel):
    id: int
    skill_dna_id: int
    endorser_id: int
    comment: str
    rating: int
    created_at: datetime


class SkillDNAProfileOut(BaseModel):
    user_id: int
    skills: list[SkillDNAOut]
    radar_metrics: dict[str, float]
    total_verified: int
    total_skills: int



app = FastAPI(title="SwipeX API", version="1.0.0", description="Role-aware intelligent job discovery and hiring platform API")
app.add_middleware(CORSMiddleware, allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


def db_session() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def record_activity(db: Session, actor_id: Optional[int], action: str, entity_type: str, entity_id: Optional[int] = None, metadata: Optional[dict] = None) -> None:
    db.add(Activity(actor_id=actor_id, action=action, entity_type=entity_type, entity_id=entity_id, metadata_json=json.dumps(metadata or {})))


def create_token(user: User) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode({"sub": str(user.id), "role": user.role, "exp": expires}, settings.jwt_secret, algorithm=ALGORITHM)


def current_user(token: str = Depends(lambda: None), db: Session = Depends(db_session)) -> User:
    # This dependency is replaced below after app creation to keep the token header explicit.
    raise HTTPException(status_code=401, detail="Authentication required")


def require_roles(*roles: Role):
    def checker(user: User = Depends(current_user)) -> User:
        if user.role not in {role.value for role in roles}:
            raise HTTPException(status_code=403, detail="Insufficient role permissions")
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is suspended")
        return user
    return checker


from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def authenticated_user(token: str = Depends(oauth2_scheme), db: Session = Depends(db_session)) -> User:
    credentials_error = HTTPException(status_code=401, detail="Invalid authentication token")
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise credentials_error
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise credentials_error
    return user


current_user = authenticated_user


def user_out(user: User) -> UserOut:
    return UserOut(id=user.id, name=user.name, email=user.email, role=user.role, is_active=user.is_active, created_at=user.created_at)


def recommendation_for(db: Session, job: Job, user: Optional[User]) -> dict:
    required = json.loads(job.skills_json or "[]")
    if not user or user.role != Role.seeker.value:
        return {"match_score": 0, "matched_skills": [], "missing_skills": required[:3]}

    profile = db.scalar(select(Profile).where(Profile.user_id == user.id))
    profile_data = json.loads(profile.data_json or "{}") if profile else {}
    resume_data = json.loads(profile.resume_json or "{}") if profile else {}
    candidate_skills = {
        str(skill).strip().lower()
        for skill in [*profile_data.get("skills", []), *resume_data.get("skills", []), *resume_data.get("extracted_skills", [])]
        if skill
    }
    matched = [skill for skill in required if skill.lower() in candidate_skills]
    missing = [skill for skill in required if skill.lower() not in candidate_skills]
    skill_score = (len(matched) / len(required) * 60) if required else 35
    
    preferred_role = str(profile_data.get("preferred_role") or "").lower()
    about_text = str(profile_data.get("about") or "").lower()
    resume_text = str(resume_data.get("text") or "").lower()
    text = f"{preferred_role} {about_text} {resume_text}"
    
    role_bonus = 20 if preferred_role and preferred_role in job.title.lower() else 0
    text_bonus = 10 if any(token in text for token in [job.title.lower(), job.company.lower()]) else 0
    location_bonus = 5 if profile_data.get("remote_preference") in ("Remote", "Open to all") and job.location.lower() == "remote" else 0
    
    feedback_adjustment = 0
    for swipe in db.scalars(select(Swipe).where(Swipe.user_id == user.id, Swipe.job_id != job.id)).all():
        feedback_job = db.get(Job, swipe.job_id)
        if not feedback_job:
            continue
        feedback_skills = {skill.lower() for skill in json.loads(feedback_job.skills_json or "[]")}
        overlap = len(feedback_skills & {skill.lower() for skill in required})
        if swipe.decision == "left":
            feedback_adjustment -= overlap * 3
        elif swipe.decision in ("right", "save"):
            feedback_adjustment += overlap * 2
            
    score = round(min(99, max(1, 20 + skill_score + role_bonus + text_bonus + location_bonus + feedback_adjustment)))
    return {"match_score": score, "matched_skills": matched, "missing_skills": missing[:3]}


def job_out(db: Session, job: Job, user: Optional[User] = None) -> JobOut:
    count = db.scalar(select(func.count(Application.id)).where(Application.job_id == job.id)) or 0
    level = "Low" if count < 30 else "Medium" if count < 70 else "High"
    skills = json.loads(job.skills_json or "[]")
    recommendation = recommendation_for(db, job, user)
    return JobOut(id=job.id, title=job.title, company=job.company, company_type=job.company_type, location=job.location, job_type=job.job_type, salary_min=job.salary_min, salary_max=job.salary_max, skills=skills, description=job.description, posted_at=job.posted_at, applicants_count=count, competition_level=level, is_early_applicant=count < 20, **recommendation)


def application_out(db: Session, application: Application) -> ApplicationOut:
    job = db.get(Job, application.job_id)
    seeker = db.get(User, application.seeker_id)
    return ApplicationOut(id=application.id, job_id=application.job_id, job_title=job.title, company=job.company, seeker_id=seeker.id, seeker_name=seeker.name, seeker_email=seeker.email, status=application.status, match_score=application.match_score, reviewer_score=application.reviewer_score, reviewer_notes=application.reviewer_notes, interview_at=application.interview_at, created_at=application.created_at, updated_at=application.updated_at)


def ats_report_out(db: Session, report: ATSReport) -> ATSReportOut:
    job = db.get(Job, report.job_id)
    seeker = db.get(User, report.seeker_id)
    return ATSReportOut(
        id=report.id,
        application_id=report.application_id,
        job_id=report.job_id,
        job_title=job.title if job else "Unknown Job",
        company=job.company if job else "Unknown Company",
        seeker_id=seeker.id if seeker else 0,
        seeker_name=seeker.name if seeker else "Unknown Seeker",
        ats_score=report.ats_score,
        matched_skills=json.loads(report.matched_skills_json or "[]"),
        missing_skills=json.loads(report.missing_skills_json or "[]"),
        extracted_keywords=json.loads(report.extracted_keywords_json or "[]"),
        suggestions=json.loads(report.suggestions_json or "[]"),
        workflow_steps=json.loads(report.workflow_steps_json or "[]"),
        created_at=report.created_at,
    )


def execute_ats_workflow(db: Session, seeker: User, job: Job, application_id: Optional[int] = None) -> ATSReport:
    steps = []

    # Step 1: Apply for Job
    step1_time = datetime.now(timezone.utc).isoformat()
    steps.append({
        "step_number": 1,
        "id": "apply_for_job",
        "title": "Apply for Job",
        "status": "completed",
        "timestamp": step1_time,
        "description": f"Triggered job application evaluation for '{job.title}' at {job.company}.",
        "details": {
            "job_id": job.id,
            "job_title": job.title,
            "company": job.company,
            "seeker_id": seeker.id,
            "seeker_name": seeker.name,
            "application_id": application_id,
        }
    })

    # Step 2a: Retrieve Resume
    profile = db.scalar(select(Profile).where(Profile.user_id == seeker.id))
    profile_data = json.loads(profile.data_json or "{}") if profile else {}
    resume_data = json.loads(profile.resume_json or "{}") if profile else {}

    resume_text = resume_data.get("text") or profile_data.get("about") or profile_data.get("headline") or ""
    candidate_skills = sorted(list({
        str(s).strip() for s in [*profile_data.get("skills", []), *resume_data.get("skills", []), *resume_data.get("extracted_skills", [])] if s
    }))
    candidate_exp = profile_data.get("experience_years") or resume_data.get("experience_years") or 0.0
    candidate_education = resume_data.get("education") or profile_data.get("education") or []

    steps.append({
        "step_number": 2,
        "id": "retrieve_resume",
        "title": "Retrieve Resume",
        "status": "completed",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "description": f"Retrieved profile and resume for candidate '{seeker.name}'.",
        "details": {
            "seeker_id": seeker.id,
            "skills_found": candidate_skills,
            "experience_years": candidate_exp,
            "education": candidate_education,
            "resume_text_preview": (resume_text[:200] + "...") if len(resume_text) > 200 else (resume_text or "Profile summary used"),
        }
    })

    # Step 2b: Retrieve Job Description
    required_skills = json.loads(job.skills_json or "[]")
    steps.append({
        "step_number": 3,
        "id": "retrieve_job_description",
        "title": "Retrieve Job Description",
        "status": "completed",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "description": f"Retrieved specifications and required skills for job '{job.title}'.",
        "details": {
            "job_id": job.id,
            "title": job.title,
            "company": job.company,
            "company_type": job.company_type,
            "location": job.location,
            "job_type": job.job_type,
            "required_skills": required_skills,
            "description_preview": (job.description[:200] + "...") if len(job.description) > 200 else job.description,
        }
    })

    # Step 3: Extract Skills & Keywords
    candidate_skills_lower = {s.lower() for s in candidate_skills}

    desc_words = re.findall(r"\b[A-Za-z0-9+#\.-]{3,}\b", job.description.lower())
    common_stops = {"the", "and", "for", "with", "this", "that", "you", "will", "are", "have", "from", "your", "our", "team", "work", "looking", "role"}
    job_keywords = sorted(list({w.title() if w not in ["sql", "html", "css", "aws", "gcp", "api"] else w.upper() for w in desc_words if w not in common_stops and len(w) > 3}))[:15]
    candidate_text_words = set(re.findall(r"\b[A-Za-z0-9+#\.-]{3,}\b", (resume_text + " " + " ".join(candidate_skills)).lower()))
    
    extracted_candidate_keywords = sorted(list({k for k in job_keywords if k.lower() in candidate_text_words}))

    steps.append({
        "step_number": 4,
        "id": "extract_skills_keywords",
        "title": "Extract Skills & Keywords",
        "status": "completed",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "description": "Extracted key technical concepts, domain terms, and skill tokens from both sources.",
        "details": {
            "candidate_extracted_skills": candidate_skills,
            "job_required_skills": required_skills,
            "extracted_job_keywords": job_keywords[:10],
            "extracted_candidate_keywords": extracted_candidate_keywords,
        }
    })

    # Step 4: Compare Resume with Job Description
    matched_skills = [s for s in required_skills if s.lower() in candidate_skills_lower]
    missing_skills = [s for s in required_skills if s.lower() not in candidate_skills_lower]
    matched_keywords = [k for k in job_keywords if k.lower() in candidate_text_words]
    missing_keywords = [k for k in job_keywords if k.lower() not in candidate_text_words][:6]

    steps.append({
        "step_number": 5,
        "id": "compare_resume_job",
        "title": "Compare Resume with Job Description",
        "status": "completed",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "description": f"Analyzed skill overlap ({len(matched_skills)}/{len(required_skills)}) and keyword alignment.",
        "details": {
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "matched_keywords_count": len(matched_keywords),
            "missing_keywords_count": len(missing_keywords),
            "skill_match_percentage": round((len(matched_skills) / len(required_skills) * 100) if required_skills else 100, 1),
        }
    })

    # Step 5: Calculate ATS Score
    skill_coverage = (len(matched_skills) / len(required_skills)) if required_skills else 0.8
    keyword_coverage = (len(matched_keywords) / len(job_keywords)) if job_keywords else 0.5
    title_bonus = 0.15 if (profile_data.get("preferred_role") or "").lower() in job.title.lower() or any(term in resume_text.lower() for term in job.title.lower().split()) else 0.05
    
    raw_score = (skill_coverage * 55) + (keyword_coverage * 30) + (title_bonus * 100)
    ats_score = round(min(98.0, max(25.0, raw_score)), 1)

    steps.append({
        "step_number": 6,
        "id": "calculate_ats_score",
        "title": "Calculate ATS Score",
        "status": "completed",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "description": f"Calculated composite ATS Score of {ats_score}%.",
        "details": {
            "final_ats_score": ats_score,
            "skill_weight_component": round(skill_coverage * 55, 1),
            "keyword_weight_component": round(keyword_coverage * 30, 1),
            "relevance_bonus_component": round(title_bonus * 100, 1),
        }
    })

    # Step 6: Identify Missing Skills
    steps.append({
        "step_number": 7,
        "id": "identify_missing_skills",
        "title": "Identify Missing Skills",
        "status": "completed",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "description": f"Identified {len(missing_skills)} missing core skills and {len(missing_keywords)} keyword gaps.",
        "details": {
            "missing_core_skills": missing_skills,
            "missing_domain_keywords": missing_keywords,
        }
    })

    # Step 7: Generate Improvement Suggestions
    suggestions = []
    if missing_skills:
        suggestions.append(f"Add critical missing skills to your resume: {', '.join(missing_skills)}.")
    if missing_keywords:
        suggestions.append(f"Include relevant job keywords in your project bullet points: {', '.join(missing_keywords[:3])}.")
    if ats_score < 75:
        suggestions.append("Tailor your work experience section to explicitly match the job title and requirements.")
    suggestions.append("Quantify your project achievements using metrics (e.g. 'improved performance by 25%').")
    if not candidate_education:
        suggestions.append("Ensure your degree and educational background are clearly formatted in a dedicated section.")

    steps.append({
        "step_number": 8,
        "id": "generate_suggestions",
        "title": "Generate Improvement Suggestions",
        "status": "completed",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "description": f"Generated {len(suggestions)} personalized action items to boost ATS match.",
        "details": {
            "suggestions": suggestions
        }
    })

    # Step 8: Store ATS Report
    report = ATSReport(
        application_id=application_id,
        job_id=job.id,
        seeker_id=seeker.id,
        ats_score=ats_score,
        matched_skills_json=json.dumps(matched_skills),
        missing_skills_json=json.dumps(missing_skills),
        extracted_keywords_json=json.dumps(matched_keywords + missing_keywords),
        suggestions_json=json.dumps(suggestions),
        workflow_steps_json=json.dumps(steps),
    )
    db.add(report)
    db.flush()

    # Step 9: Store ATS Report step log
    steps.append({
        "step_number": 9,
        "id": "store_ats_report",
        "title": "Store ATS Report",
        "status": "completed",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "description": f"Saved ATS report #{report.id} to system database.",
        "details": {
            "report_id": report.id,
            "application_id": application_id,
            "created_at": report.created_at.isoformat(),
        }
    })

    # Step 10: End Node
    steps.append({
        "step_number": 10,
        "id": "end",
        "title": "End",
        "status": "completed",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "description": "ATS Workflow execution successfully completed.",
        "details": {
            "status": "SUCCESS",
            "report_id": report.id,
        }
    })

    report.workflow_steps_json = json.dumps(steps)
    record_activity(db, seeker.id, "ats_workflow_executed", "ats_report", report.id, {"job_id": job.id, "ats_score": ats_score})
    return report



def dashboard_data(db: Session, user: User) -> dict:
    applications = db.scalars(select(Application).where(Application.seeker_id == user.id)).all()
    saved_count = db.scalar(select(func.count(SavedJob.id)).where(SavedJob.user_id == user.id)) or 0
    jobs = db.scalars(select(Job).where(Job.is_active.is_(True))).all()
    statuses = {}
    for application in applications:
        statuses[application.status] = statuses.get(application.status, 0) + 1
    average = round(sum(item.match_score for item in applications) / len(applications)) if applications else 0
    last7 = []
    for offset in range(6, -1, -1):
        day = datetime.now(timezone.utc) - timedelta(days=offset)
        last7.append({"date": day.isoformat(), "applications": sum(1 for item in applications if item.created_at.date() == day.date())})
    return {"applications": len(applications), "new_matches": min(12, saved_count + 2), "saved_jobs": saved_count, "shortlisted": statuses.get("Shortlisted", 0), "interviews": statuses.get("Interview", 0), "rejected": statuses.get("Rejected", 0), "average_match": average, "skill_gaps": [], "notifications": [{"type": "match", "title": "High-match roles are waiting", "detail": f"{sum(1 for job in jobs if len(json.loads(job.skills_json or '[]')) >= 3)} roles are ready to review."}, {"type": "competition", "title": "Beat the crowd", "detail": "Review newly posted roles before competition rises."}], "trend": last7}


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(engine)
    if settings.database_url.startswith("sqlite") and "resume_json" not in {column["name"] for column in inspect(engine).get_columns("profiles")}:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN resume_json TEXT DEFAULT '{}'"))
    db = SessionLocal()
    if not db.scalar(select(User).where(User.email == "admin@swipex.dev")):
        admin = User(name="SwipeX Admin", email="admin@swipex.dev", password_hash=hash_password("admin12345"), role=Role.admin.value)
        recruiter = User(name="NovaTech HR", email="hr@swipex.dev", password_hash=hash_password("recruiter123"), role=Role.recruiter.value)
        interviewer = User(name="Hiring Panel", email="interviewer@swipex.dev", password_hash=hash_password("interviewer123"), role=Role.interviewer.value)
        seeker = User(name="Demo Candidate", email="candidate@swipex.dev", password_hash=hash_password("candidate123"), role=Role.seeker.value)
        db.add_all([admin, recruiter, interviewer, seeker])
        db.flush()
        jobs = [
            Job(recruiter_id=recruiter.id, title="Frontend Engineer", company="NovaTech Systems", company_type="MNC", location="Bengaluru", job_type="Full-time", salary_min=800000, salary_max=1400000, skills_json=json.dumps(["React", "JavaScript", "Tailwind"]), description="Build customer-facing dashboards used by enterprise clients."),
            Job(recruiter_id=recruiter.id, title="Product Engineer Intern", company="NovaTech Systems", company_type="Startup", location="Remote", job_type="Internship", salary_min=30000, salary_max=50000, skills_json=json.dumps(["React", "Node.js", "SQL"]), description="Ship product features with a collaborative engineering team."),
        ]
        db.add_all(jobs)
        record_activity(db, admin.id, "system_seeded", "platform", None, {"demo": True})
        db.commit()
    db.close()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "swipex-api"}


@app.get("/")
def root() -> dict:
    return {
        "service": "SwipeX API",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
    }


@app.post("/api/auth/register", response_model=TokenOut, status_code=201)
def register(payload: RegisterIn, db: Session = Depends(db_session)) -> TokenOut:
    if db.scalar(select(User).where(User.email == payload.email.lower())):
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(name=payload.name.strip(), email=payload.email.lower(), password_hash=hash_password(payload.password), role=payload.role.value)
    db.add(user)
    db.flush()
    record_activity(db, user.id, "registered", "user", user.id, {"role": user.role})
    db.commit()
    return TokenOut(access_token=create_token(user), user=user_out(user))


@app.post("/api/auth/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(db_session)) -> TokenOut:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    record_activity(db, user.id, "logged_in", "user", user.id)
    db.commit()
    return TokenOut(access_token=create_token(user), user=user_out(user))


@app.get("/api/me", response_model=UserOut)
def me(user: User = Depends(current_user)) -> UserOut:
    return user_out(user)


@app.get("/api/profile")
def get_profile(db: Session = Depends(db_session), user: User = Depends(require_roles(Role.seeker))) -> dict:
    profile = db.scalar(select(Profile).where(Profile.user_id == user.id))
    data = json.loads(profile.data_json) if profile else {"skills": [], "availability": "Open to opportunities", "remote_preference": "Hybrid"}
    data["resume"] = json.loads(profile.resume_json) if profile and profile.resume_json else None
    return data


@app.put("/api/profile")
def update_profile(payload: dict, db: Session = Depends(db_session), user: User = Depends(require_roles(Role.seeker))) -> dict:
    profile = db.scalar(select(Profile).where(Profile.user_id == user.id))
    if profile:
        profile.data_json = json.dumps(payload)
    else:
        db.add(Profile(user_id=user.id, data_json=json.dumps(payload)))
    record_activity(db, user.id, "profile_updated", "profile", user.id)
    db.commit()
    return payload


@app.get("/api/jobs", response_model=list[JobOut])
def list_jobs(search: str = "", company_type: Optional[str] = None, job_type: Optional[str] = None, location: Optional[str] = None, competition: Optional[str] = None, db: Session = Depends(db_session), user: User = Depends(current_user)) -> list[JobOut]:
    jobs = db.scalars(select(Job).where(Job.is_active.is_(True)).order_by(Job.posted_at.desc())).all()
    result = []
    for job in jobs:
        latest_swipe = db.scalar(select(Swipe).where(Swipe.user_id == user.id, Swipe.job_id == job.id).order_by(Swipe.created_at.desc()))
        if latest_swipe and latest_swipe.decision in ("left", "right"):
            continue
        item = job_out(db, job, user)
        haystack = " ".join([item.title, item.company, item.location, *item.skills]).lower()
        if search.lower() not in haystack or (company_type and item.company_type != company_type) or (job_type and item.job_type != job_type) or (location and item.location != location) or (competition and item.competition_level != competition):
            continue
        result.append(item)
    return sorted(result, key=lambda item: (item.match_score, item.posted_at), reverse=True)


@app.post("/api/jobs", response_model=JobOut, status_code=201)
def create_job(payload: JobIn, db: Session = Depends(db_session), user: User = Depends(require_roles(Role.recruiter, Role.admin))) -> JobOut:
    job = Job(recruiter_id=user.id, title=payload.title, company=payload.company, company_type=payload.company_type, location=payload.location, job_type=payload.job_type, salary_min=payload.salary_min, salary_max=payload.salary_max, skills_json=json.dumps(payload.skills), description=payload.description)
    db.add(job)
    db.flush()
    record_activity(db, user.id, "job_created", "job", job.id, {"title": job.title})
    db.commit()
    db.refresh(job)
    return job_out(db, job)


@app.delete("/api/jobs/{job_id}", status_code=204)
def delete_job(job_id: int, db: Session = Depends(db_session), user: User = Depends(require_roles(Role.recruiter, Role.admin))) -> None:
    job = db.get(Job, job_id)
    if not job or (user.role == Role.recruiter.value and job.recruiter_id != user.id):
        raise HTTPException(status_code=404, detail="Job not found")
    job.is_active = False
    record_activity(db, user.id, "job_deactivated", "job", job.id)
    db.commit()


@app.post("/api/swipes")
def swipe(payload: SwipeIn, db: Session = Depends(db_session), user: User = Depends(require_roles(Role.seeker))) -> dict:
    job = db.get(Job, payload.job_id)
    if not job or not job.is_active:
        raise HTTPException(status_code=404, detail="Job not found")
    db.add(Swipe(user_id=user.id, job_id=job.id, decision=payload.decision))
    application = None
    if payload.decision == "save" and not db.scalar(select(SavedJob).where(SavedJob.job_id == job.id, SavedJob.user_id == user.id)):
        db.add(SavedJob(user_id=user.id, job_id=job.id))
    if payload.decision == "right":
        existing_app = db.scalar(select(Application).where(Application.job_id == job.id, Application.seeker_id == user.id))
        if not existing_app:
            application = Application(job_id=job.id, seeker_id=user.id, match_score=recommendation_for(db, job, user)["match_score"])
            db.add(application)
            db.flush()
            db.add(Notification(user_id=user.id, title="Application received", detail=f"Your application for {job.title} is now being reviewed."))
            execute_ats_workflow(db, user, job, application_id=application.id)
    record_activity(db, user.id, f"swipe_{payload.decision}", "job", job.id)
    db.commit()
    return {"success": True, "application_id": application.id if application else None}



@app.get("/api/saved", response_model=list[JobOut])
def saved_jobs(db: Session = Depends(db_session), user: User = Depends(require_roles(Role.seeker))) -> list[JobOut]:
    rows = db.scalars(select(SavedJob).where(SavedJob.user_id == user.id).order_by(SavedJob.created_at.desc())).all()
    return [job_out(db, db.get(Job, row.job_id)) for row in rows]


@app.get("/api/dashboard")
def dashboard(db: Session = Depends(db_session), user: User = Depends(require_roles(Role.seeker))) -> dict:
    return dashboard_data(db, user)


@app.get("/api/applications", response_model=list[ApplicationOut])
def seeker_applications(db: Session = Depends(db_session), user: User = Depends(require_roles(Role.seeker))) -> list[ApplicationOut]:
    applications = db.scalars(select(Application).where(Application.seeker_id == user.id).order_by(Application.updated_at.desc())).all()
    return [application_out(db, item) for item in applications]


@app.patch("/api/applications/{application_id}/status", response_model=ApplicationOut)
def update_status(application_id: int, payload: StatusIn, db: Session = Depends(db_session), user: User = Depends(require_roles(Role.recruiter, Role.interviewer, Role.admin))) -> ApplicationOut:
    application = db.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    application.status = payload.status
    application.reviewer_notes = payload.notes
    application.reviewer_score = payload.reviewer_score
    application.interview_at = payload.interview_at
    application.updated_at = datetime.now(timezone.utc)
    db.add(Notification(user_id=application.seeker_id, title=f"Application {payload.status.lower()}", detail=f"Your application status changed to {payload.status}."))
    record_activity(db, user.id, "application_status_changed", "application", application.id, {"status": payload.status})
    db.commit()
    db.refresh(application)
    return application_out(db, application)


@app.get("/api/recruiter/candidates", response_model=list[ApplicationOut])
def recruiter_candidates(job_id: Optional[int] = None, status_filter: Optional[str] = Query(default=None, alias="status"), db: Session = Depends(db_session), user: User = Depends(require_roles(Role.recruiter, Role.interviewer, Role.admin))) -> list[ApplicationOut]:
    query = select(Application).join(Job, Job.id == Application.job_id)
    if user.role == Role.recruiter.value:
        query = query.where(Job.recruiter_id == user.id)
    if job_id:
        query = query.where(Application.job_id == job_id)
    if status_filter:
        query = query.where(Application.status == status_filter)
    return [application_out(db, item) for item in db.scalars(query.order_by(Application.updated_at.desc())).all()]


@app.post("/api/interviewer/applications/{application_id}/decision", response_model=ApplicationOut)
def interviewer_decision(application_id: int, payload: StatusIn, db: Session = Depends(db_session), user: User = Depends(require_roles(Role.interviewer, Role.admin))) -> ApplicationOut:
    return update_status(application_id, payload, db, user)


@app.get("/api/notifications")
def notifications(db: Session = Depends(db_session), user: User = Depends(current_user)) -> list[dict]:
    rows = db.scalars(select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc())).all()
    return [{"id": row.id, "title": row.title, "detail": row.detail, "is_read": row.is_read, "created_at": row.created_at} for row in rows]


def extract_resume_text(filename: str, content: bytes) -> str:
    suffix = (filename or "").lower().rsplit(".", 1)[-1]
    if suffix == "pdf":
        try:
            from pypdf import PdfReader
            from io import BytesIO
            return "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(content)).pages)
        except Exception:
            pass
    if suffix == "docx":
        try:
            from docx import Document
            from io import BytesIO
            return "\n".join(paragraph.text for paragraph in Document(BytesIO(content)).paragraphs)
        except Exception:
            pass
    return content.decode("utf-8", errors="ignore")


def local_parse_resume(text: str) -> dict:
    normalized = text.lower()
    known_skills = [
        "react", "python", "sql", "node.js", "javascript", "typescript", "tailwind", "django", "fastapi",
        "git", "docker", "aws", "excel", "power bi", "java", "spring boot", "flask", "mongodb", "playwright",
        "html", "css", "c++", "c#", "express", "postgresql", "mysql", "redis", "kubernetes", "graphql",
        "rest api", "next.js", "vue", "angular", "redux", "pandas", "numpy", "pytorch", "tensorflow",
        "scikit-learn", "ci/cd", "figma", "jira", "linux", "gcp", "azure"
    ]
    extracted = []
    for skill in known_skills:
        pattern = r"(?<!\w)" + re.escape(skill) + r"(?!\w)"
        if re.search(pattern, normalized):
            formatted = skill.upper() if skill in ["sql", "html", "css", "aws", "gcp", "api", "ci/cd"] else skill.title() if skill not in ["react", "node.js", "next.js"] else skill
            extracted.append(formatted)
            
    experience_matches = re.findall(r"(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?|yr)", normalized)
    education_lines = [line.strip() for line in text.splitlines() if re.search(r"\b(bachelor|master|b\.tech|m\.tech|degree|university|college|phd|diploma|b\.e\.|m\.e\.)\b", line, re.I)]
    
    candidate_skills_lower = {s.lower() for s in extracted}
    missing_benchmarks = ["React", "Python", "SQL", "JavaScript", "Git", "Docker", "Node.js", "Tailwind"]
    missing = [s for s in missing_benchmarks if s.lower() not in candidate_skills_lower]
    
    return {
        "skills": list(dict.fromkeys(extracted)),
        "experience_years": float(experience_matches[0]) if experience_matches else None,
        "education": education_lines[:5],
        "text": text[:12000],
        "missing_skills": missing[:3]
    }


def parse_resume(text: str) -> tuple[dict, str]:
    fallback = local_parse_resume(text)
    if not settings.ai_api_key:
        return fallback, "local"

    schema = {
        "skills": ["string"],
        "experience_years": "number or null",
        "education": ["string"],
        "missing_skills": ["string"],
    }
    payload = {
        "model": settings.ai_model,
        "temperature": 0,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": "You are a resume parsing service. Return only valid JSON matching the requested schema. Do not invent facts."},
            {"role": "user", "content": json.dumps({"schema": schema, "resume_text": text[:12000]})},
        ],
    }
    request = Request(settings.ai_api_url, data=json.dumps(payload).encode("utf-8"), headers={"Authorization": f"Bearer {settings.ai_api_key}", "Content-Type": "application/json"}, method="POST")
    try:
        with urlopen(request, timeout=settings.ai_timeout_seconds) as response:
            body = json.loads(response.read().decode("utf-8"))
        content = body["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        skills = sorted({str(skill).strip() for skill in parsed.get("skills", []) if str(skill).strip()})
        experience = parsed.get("experience_years")
        experience = float(experience) if experience is not None else None
        education = [str(item).strip() for item in parsed.get("education", []) if str(item).strip()]
        missing = [str(item).strip() for item in parsed.get("missing_skills", []) if str(item).strip()]
        return {"skills": skills, "experience_years": experience, "education": education[:5], "text": text[:12000], "missing_skills": missing[:3]}, "ai"
    except (KeyError, TypeError, ValueError, HTTPError, URLError, TimeoutError):
        return fallback, "local"


@app.post("/api/resumes/analyze")
async def analyze_resume(file: UploadFile = File(...), db: Session = Depends(db_session), user: User = Depends(require_roles(Role.seeker))) -> dict:
    text = extract_resume_text(file.filename or "resume.txt", await file.read())
    parsed, parser = parse_resume(text)
    profile = db.scalar(select(Profile).where(Profile.user_id == user.id))
    if not profile:
        profile = Profile(user_id=user.id, data_json=json.dumps({"skills": parsed["skills"]}))
        db.add(profile)
    else:
        profile_data = json.loads(profile.data_json or "{}")
        profile_data["skills"] = sorted(set(profile_data.get("skills", []) + parsed["skills"]))
        if parsed["experience_years"] is not None and not profile_data.get("experience_years"):
            profile_data["experience_years"] = parsed["experience_years"]
        profile.data_json = json.dumps(profile_data)
    ats_score = min(97, 55 + len(parsed["skills"]) * 8)
    stored = {"filename": file.filename, "ats_score": ats_score, "parser": parser, **parsed}
    profile.resume_json = json.dumps(stored)
    record_activity(db, user.id, "resume_parsed", "resume", user.id, {"filename": file.filename, "skills": parsed["skills"]})
    db.commit()
    return {"filename": file.filename, "ats_score": ats_score, "parser": parser, "extracted_skills": parsed["skills"], "missing_skills": parsed["missing_skills"], "experience_years": parsed["experience_years"], "education": parsed["education"], "suggestions": ["Use exact keywords from target job descriptions.", "Add measurable outcomes to recent projects.", "Keep skills and experience sections machine-readable."]}


@app.get("/api/admin/overview")
def admin_overview(db: Session = Depends(db_session), user: User = Depends(require_roles(Role.admin))) -> dict:
    return {"users": db.scalar(select(func.count(User.id))) or 0, "active_users": db.scalar(select(func.count(User.id)).where(User.is_active.is_(True))) or 0, "jobs": db.scalar(select(func.count(Job.id)).where(Job.is_active.is_(True))) or 0, "applications": db.scalar(select(func.count(Application.id))) or 0, "swipes": db.scalar(select(func.count(Swipe.id))) or 0, "interviews": db.scalar(select(func.count(Application.id)).where(Application.status == "Interview")) or 0}


@app.get("/api/admin/activity")
def admin_activity(limit: int = Query(default=100, le=500), db: Session = Depends(db_session), user: User = Depends(require_roles(Role.admin))) -> list[dict]:
    rows = db.scalars(select(Activity).order_by(Activity.created_at.desc()).limit(limit)).all()
    return [{"id": row.id, "actor_id": row.actor_id, "action": row.action, "entity_type": row.entity_type, "entity_id": row.entity_id, "metadata": json.loads(row.metadata_json or "{}"), "created_at": row.created_at} for row in rows]


@app.get("/api/admin/users", response_model=list[UserOut])
def admin_users(db: Session = Depends(db_session), user: User = Depends(require_roles(Role.admin))) -> list[UserOut]:
    return [user_out(item) for item in db.scalars(select(User).order_by(User.created_at.desc())).all()]


@app.patch("/api/admin/users/{user_id}/suspension", response_model=UserOut)
def suspend_user(user_id: int, suspended: bool, db: Session = Depends(db_session), user: User = Depends(require_roles(Role.admin))) -> UserOut:
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == user.id:
        raise HTTPException(status_code=400, detail="You cannot suspend your own account")
    target.is_active = not suspended
    record_activity(db, user.id, "user_suspension_changed", "user", target.id, {"suspended": suspended})
    db.commit()
    return user_out(target)


@app.post("/api/ats-workflow/run", response_model=ATSReportOut)
def run_ats_workflow_endpoint(payload: ATSWorkflowIn, db: Session = Depends(db_session), user: User = Depends(require_roles(Role.seeker))) -> ATSReportOut:
    job = db.get(Job, payload.job_id)
    if not job or not job.is_active:
        raise HTTPException(status_code=404, detail="Job not found")
    report = execute_ats_workflow(db, user, job, application_id=payload.application_id)
    db.commit()
    db.refresh(report)
    return ats_report_out(db, report)


@app.get("/api/applications/{application_id}/ats-report", response_model=ATSReportOut)
def application_ats_report(application_id: int, db: Session = Depends(db_session), user: User = Depends(current_user)) -> ATSReportOut:
    application = db.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    report = db.scalar(select(ATSReport).where(ATSReport.application_id == application_id).order_by(ATSReport.created_at.desc()))
    if not report:
        job = db.get(Job, application.job_id)
        seeker = db.get(User, application.seeker_id)
        report = execute_ats_workflow(db, seeker, job, application_id=application.id)
        db.commit()
        db.refresh(report)
    return ats_report_out(db, report)


@app.get("/api/ats-reports/{report_id}", response_model=ATSReportOut)
def get_ats_report(report_id: int, db: Session = Depends(db_session), user: User = Depends(current_user)) -> ATSReportOut:
    report = db.get(ATSReport, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="ATS Report not found")
    return ats_report_out(db, report)


def skill_dna_out(item: CandidateSkillDNA) -> SkillDNAOut:
    return SkillDNAOut(
        id=item.id,
        user_id=item.user_id,
        category=item.category,
        skill_name=item.skill_name,
        proficiency_level=item.proficiency_level,
        years_experience=item.years_experience,
        verified=item.verified,
        ai_confidence_score=item.ai_confidence_score,
        endorsements_count=item.endorsements_count,
        created_at=item.created_at,
    )


def compute_skill_dna_profile(db: Session, user_id: int) -> SkillDNAProfileOut:
    skills = db.scalars(select(CandidateSkillDNA).where(CandidateSkillDNA.user_id == user_id).order_by(CandidateSkillDNA.proficiency_level.desc())).all()
    categories = ["Technical", "Domain", "Soft", "Tooling"]
    radar = {cat: 0.0 for cat in categories}
    counts = {cat: 0 for cat in categories}

    for s in skills:
        cat = s.category if s.category in radar else "Technical"
        radar[cat] += s.proficiency_level * 20.0  # scale 1-5 to 20-100
        counts[cat] += 1

    for cat in categories:
        if counts[cat] > 0:
            radar[cat] = round(radar[cat] / counts[cat], 1)
        else:
            radar[cat] = 20.0  # default baseline

    total_verified = sum(1 for s in skills if s.verified or s.endorsements_count > 0)
    return SkillDNAProfileOut(
        user_id=user_id,
        skills=[skill_dna_out(s) for s in skills],
        radar_metrics=radar,
        total_verified=total_verified,
        total_skills=len(skills),
    )


@app.get("/api/skill-dna", response_model=SkillDNAProfileOut)
def get_my_skill_dna(db: Session = Depends(db_session), user: User = Depends(current_user)) -> SkillDNAProfileOut:
    return compute_skill_dna_profile(db, user.id)


@app.get("/api/candidates/{candidate_id}/skill-dna", response_model=SkillDNAProfileOut)
def get_candidate_skill_dna(candidate_id: int, db: Session = Depends(db_session), user: User = Depends(current_user)) -> SkillDNAProfileOut:
    candidate = db.get(User, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return compute_skill_dna_profile(db, candidate.id)


@app.post("/api/skill-dna", response_model=SkillDNAOut)
def create_or_update_skill_dna(payload: SkillDNAIn, db: Session = Depends(db_session), user: User = Depends(require_roles(Role.seeker))) -> SkillDNAOut:
    existing = db.scalar(
        select(CandidateSkillDNA).where(
            CandidateSkillDNA.user_id == user.id,
            func.lower(CandidateSkillDNA.skill_name) == payload.skill_name.strip().lower(),
        )
    )
    if existing:
        existing.category = payload.category
        existing.proficiency_level = payload.proficiency_level
        existing.years_experience = payload.years_experience
        db.commit()
        db.refresh(existing)
        return skill_dna_out(existing)

    item = CandidateSkillDNA(
        user_id=user.id,
        category=payload.category,
        skill_name=payload.skill_name.strip(),
        proficiency_level=payload.proficiency_level,
        years_experience=payload.years_experience,
        verified=payload.years_experience >= 2.0 or payload.proficiency_level >= 4,
        ai_confidence_score=round(min(0.95, 0.70 + (payload.proficiency_level * 0.05)), 2),
        endorsements_count=0,
    )
    db.add(item)
    record_activity(db, user.id, "skill_dna_added", "skill_dna", None, {"skill": payload.skill_name})
    db.commit()
    db.refresh(item)
    return skill_dna_out(item)


@app.post("/api/skill-dna/{skill_id}/endorse", response_model=SkillEndorsementOut)
def endorse_candidate_skill(skill_id: int, payload: SkillEndorsementIn, db: Session = Depends(db_session), user: User = Depends(current_user)) -> SkillEndorsementOut:
    skill = db.get(CandidateSkillDNA, skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    if skill.user_id == user.id:
        raise HTTPException(status_code=400, detail="You cannot endorse your own skill")

    endorsement = SkillEndorsement(
        skill_dna_id=skill.id,
        endorser_id=user.id,
        comment=payload.comment.strip(),
        rating=payload.rating,
    )
    skill.endorsements_count += 1
    skill.verified = True
    db.add(endorsement)
    record_activity(db, user.id, "skill_endorsed", "skill_dna", skill.id, {"rating": payload.rating})
    db.commit()
    db.refresh(endorsement)
    return SkillEndorsementOut(
        id=endorsement.id,
        skill_dna_id=endorsement.skill_dna_id,
        endorser_id=endorsement.endorser_id,
        comment=endorsement.comment,
        rating=endorsement.rating,
        created_at=endorsement.created_at,
    )

