# app/services/auth_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException
from app.core.models import User, CandidateProfile, RecruiterProfile
from app.core.schemas import UserCreate
from app.core.security import get_password_hash, verify_password, create_access_token
from app.utils.logger import swipex_logger

class AuthService:
    @staticmethod
    async def register_user(user_in: UserCreate, db: AsyncSession):
        swipex_logger.info(f"Attempting to register new {user_in.role}: {user_in.email}")
        
        # 1. Check if email exists
        result = await db.execute(select(User).where(User.email == user_in.email))
        if result.scalars().first():
            swipex_logger.warning(f"Registration failed: {user_in.email} already exists.")
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # 2. Hash Password and Create User
        hashed_pw = get_password_hash(user_in.password)
        new_user = User(email=user_in.email, password_hash=hashed_pw, role=user_in.role)
        db.add(new_user)
        await db.flush() # Flush to instantly get the UUID
        
        # 3. Create Corresponding Profile
        if user_in.role == "candidate":
            profile = CandidateProfile(user_id=new_user.id, full_name=user_in.full_name)
        else:
            profile = RecruiterProfile(user_id=new_user.id, company_name=user_in.full_name)
        
        db.add(profile)
        await db.commit()
        swipex_logger.success(f"User {user_in.email} registered successfully.")
        
        # 4. Generate Token
        access_token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role})
        return {
            "access_token": access_token, 
            "token_type": "bearer", 
            "role": new_user.role, 
            "user_id": new_user.id
        }

    @staticmethod
    async def authenticate_user(email: str, password: str, db: AsyncSession):
        swipex_logger.info(f"Authentication attempt for: {email}")
        
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        
        if not user or not verify_password(password, user.password_hash):
            swipex_logger.error(f"Authentication failed for: {email}")
            raise HTTPException(status_code=400, detail="Incorrect email or password")
            
        swipex_logger.success(f"User {email} logged in successfully.")
        access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": user.role,
            "user_id": user.id,
        }