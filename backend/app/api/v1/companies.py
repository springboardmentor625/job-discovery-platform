from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any, List

from app.core.dependencies import get_db, get_current_active_user
from app.models.user import User, UserRole
from app.models.company import Company
from app.schemas.company import Company as CompanySchema, CompanyCreate, CompanyUpdate

router = APIRouter()

@router.post("/", response_model=CompanySchema)
def create_company(
    *,
    db: Session = Depends(get_db),
    company_in: CompanyCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    if current_user.role != UserRole.recruiter and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Only recruiters can create companies")
        
    company = Company(
        **company_in.model_dump(),
        user_id=current_user.user_id
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company

@router.get("/me", response_model=CompanySchema)
def get_my_company(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    company = db.query(Company).filter(Company.user_id == current_user.user_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.get("/", response_model=List[CompanySchema])
def get_companies(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    companies = db.query(Company).offset(skip).limit(limit).all()
    return companies

@router.get("/{company_id}", response_model=CompanySchema)
def get_company(
    company_id: str,
    db: Session = Depends(get_db),
) -> Any:
    company = db.query(Company).filter(Company.company_id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.put("/{company_id}", response_model=CompanySchema)
def update_company(
    *,
    company_id: str,
    company_in: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    company = db.query(Company).filter(Company.company_id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    if company.user_id != current_user.user_id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    update_data = company_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(company, field, update_data[field])
        
    db.commit()
    db.refresh(company)
    return company
