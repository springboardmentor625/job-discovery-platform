# app/api/v1/endpoints/auth.py
from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.schemas import UserCreate, TokenResponse
from app.services.auth_service import AuthService

router = APIRouter()

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """Registers a new candidate or recruiter."""
    return await AuthService.register_user(user_in, db)

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """Authenticates a user and returns a JWT."""
    return await AuthService.authenticate_user(form_data.username, form_data.password, db)