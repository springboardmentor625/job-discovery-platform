from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from .database import SessionLocal
from .schemas import UserCreate, CompanyCreate
from .models import User, Company

app = FastAPI()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {"message": "Welcome to SwipeX API"}


@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=user.password,
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