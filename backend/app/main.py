from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas, crud
from .database import get_db
from sqlalchemy.orm import Session
from .database import SessionLocal
from .schemas import UserCreate, CompanyCreate, CompanyResponse
from .models import User, Company
from .jobs import router as jobs_router
from .resumes import router as resumes_router
from .auth import hash_password, verify_password, create_access_token, get_current_user, require_role
from .applications import router as applications_router
from .swipes import router as swipes_router, get_swipe_history
from .notifications import router as notifications_router
from .recommendations import router as recommendations_router
from .ats_reports import router as ats_reports_router
from .candidate_profile import router as candidate_profile_router
from .analytics import router as analytics_router
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


app = FastAPI(
    title = "SwipeX API"
)
app.include_router(jobs_router)
app.include_router(resumes_router)
app.include_router(applications_router)
app.include_router(swipes_router)
app.include_router(notifications_router)
app.include_router(recommendations_router)
app.include_router(ats_reports_router)
app.include_router(candidate_profile_router)
app.include_router(analytics_router)

# CORS configuration from environment variables
cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/candidate-test")
def candidate_test(
    current_user: User = Depends(require_role("candidate"))
):
    return {
        "message": "Candidate access granted",
        "user_id": current_user.user_id,
        "role": current_user.role
    }        


@app.get("/")
def home():
    return {"message": "Welcome to SwipeX API"}

@app.get("/me")
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    return {
        "user_id": current_user.user_id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role
    }

@app.get("/swipe-history", response_model=list[schemas.SwipeHistoryResponse])
def get_user_swipe_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_swipe_history(current_user=current_user, db=db)



@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hash_password(user.password),
        role=user.role,
        phone=user.phone
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "user_id": new_user.user_id
    }

@app.post("/login", response_model=schemas.TokenResponse)
def login(user: schemas.LoginRequest, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if db_user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        user.password,
        db_user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={
            "sub": str(db_user.user_id),
            "role": db_user.role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.post("/companies")
def create_company(company: CompanyCreate, db: Session = Depends(get_db)):

    new_company = Company(
        company_name=company.company_name,
        company_type=company.company_type,
        industry=company.industry,
        website=company.website,
        headquarters=company.headquarters
    )

    db.add(new_company)
    db.commit()
    db.refresh(new_company)

    return {
        "message": "Company created successfully",
        "company_id": new_company.company_id
    }
@app.get("/companies")
def get_companies(db: Session = Depends(get_db)):
    companies = db.query(Company).all()

    return companies

@app.get("/companies/{company_id}")
def get_company(company_id: int, db: Session = Depends(get_db)):
    company = db.query(Company).filter(
        Company.company_id == company_id
    ).first()

    if not company:
        return {"message": "Company not found"}

    return company

@app.put("/companies/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: int,
    company_data: CompanyCreate,
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(
        Company.company_id == company_id
    ).first()

    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    company.company_name = company_data.company_name
    company.company_type = company_data.company_type
    company.industry = company_data.industry
    company.website = company_data.website
    company.headquarters = company_data.headquarters

    db.commit()
    db.refresh(company)

    return company


@app.delete("/companies/{company_id}")
def delete_company(
    company_id: int,
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(
        Company.company_id == company_id
    ).first()

    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    db.delete(company)
    db.commit()

    return {
        "message": "Company deleted successfully"
    }
