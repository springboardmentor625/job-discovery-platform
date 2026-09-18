# app/api/deps.py
from typing import AsyncGenerator
import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select # <-- THIS IS THE MISSING PIECE!

from app.core.database import async_session_maker
from app.core.config import settings
from app.core.models import User

# This tells FastAPI where the login endpoint is for the Swagger UI "Authorize" button
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides a database session for each request."""
    async with async_session_maker() as session:
        yield session

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    """Decodes the JWT and returns the currently logged-in user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # Now Python knows exactly what 'select' means!
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user