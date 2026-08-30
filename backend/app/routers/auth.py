from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import shutil
import os
import uuid
from app.database import get_db
from app.dependencies import get_current_user
from app.models import CandidateProfile, User, Resume, PasswordResetToken
from app.schemas import (
    CandidateMeResponse,
    CandidateProfileOut,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserOut,
)
from app.security import create_access_token, get_password_hash, verify_password
router = APIRouter(prefix="/api/auth", tags=["auth"])
@router.post("/register", response_model=TokenResponse)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    existing_user = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    try:
        user = User(
            full_name=payload.full_name,
            email=payload.email.lower(),
            password_hash=get_password_hash(payload.password),
            role="candidate",
            phone=payload.phone,
            profile_picture=None,
            is_verified=False,
        )
        db.add(user)
        db.flush()
        profile = CandidateProfile(
            user_id=user.user_id,
        )
        db.add(profile)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Registration failed")
    token = create_access_token(user.user_id, {"user_id": user.user_id, "role": user.role, "email": user.email})
    return TokenResponse(access_token=token)
@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        return {"message": "If an account exists for this email, a password reset link has been sent."}
    
    # Generate secure token
    raw_token = uuid.uuid4().hex
    token_to_send = f"{user.user_id}:{raw_token}"
    
    token_hash = get_password_hash(raw_token)
    
    from datetime import datetime, timedelta
    expires = datetime.utcnow() + timedelta(minutes=15)
    
    reset_token = PasswordResetToken(
        user_id=user.user_id,
        token_hash=token_hash,
        expires_at=expires
    )
    db.add(reset_token)
    db.commit()
    
    # Print the link to the console for development testing
    print(f"DEVELOPMENT MODE: Password reset link: http://localhost:5173/reset-password?token={token_to_send}")
    
    return {"message": "If an account exists for this email, a password reset link has been sent."}

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    from datetime import datetime
    
    try:
        user_id_str, raw_token = payload.token.split(":", 1)
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid token format")
    
    # Find active tokens for this user
    tokens = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user_id,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).all()
    
    valid_token_record = None
    from app.security import verify_password
    for t in tokens:
        if verify_password(raw_token, t.token_hash):
            valid_token_record = t
            break
            
    if not valid_token_record:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.password_hash = get_password_hash(payload.password)
    
    # Invalidate token by deleting it (single-use)
    db.delete(valid_token_record)
    db.commit()
    
    return {"message": "Password updated successfully. Please log in again."}
@router.post("/login", response_model=TokenResponse)
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token(user.user_id, {"user_id": user.user_id, "role": user.role, "email": user.email})
    return TokenResponse(access_token=token)
@router.get("/me", response_model=CandidateMeResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.user_id).first()
    resume = db.query(Resume).filter(Resume.user_id == current_user.user_id).first()
    return CandidateMeResponse(
        user=UserOut(
            user_id=current_user.user_id,
            full_name=current_user.full_name,
            email=current_user.email,
            role=current_user.role,
            phone=current_user.phone,
            profile_picture=current_user.profile_picture,
            is_verified=current_user.is_verified,
            created_at=str(current_user.created_at),
        ),
        profile=CandidateProfileOut(
            profile_id=profile.profile_id,
            user_id=profile.user_id,
            headline=profile.headline,
            summary=profile.summary,
            city=profile.city,
            state=profile.state,
            experience_years=profile.experience_years,
            branch=profile.branch,
            stream=profile.stream,
            projects=profile.projects,
            certifications=profile.certifications,
            skills=profile.skills,
            preferred_job_type=profile.preferred_job_type,
            preferred_city=profile.preferred_city,
            preferred_state=profile.preferred_state,
        ) if profile else None,
        has_resume=resume is not None,
    )
@router.put("/profile", response_model=CandidateMeResponse)
def update_profile(payload: UpdateProfileRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.full_name = payload.full_name
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.user_id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.user_id)
        db.add(profile)
    profile.headline = payload.headline
    profile.summary = payload.summary
    profile.city = payload.city
    profile.state = payload.state
    profile.experience_years = payload.experience_years
    profile.branch = payload.branch
    profile.stream = payload.stream
    profile.projects = payload.projects
    profile.certifications = payload.certifications
    profile.skills = payload.skills
    profile.preferred_job_type = payload.preferred_job_type
    profile.preferred_city = payload.preferred_city
    profile.preferred_state = payload.preferred_state
    db.commit()
    return get_me(current_user=current_user, db=db)
@router.post("/logout")
def logout_user():
    return {"message": "Logged out successfully"}
@router.post("/profile-picture")
def upload_profile_picture(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{current_user.user_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
    file_path = os.path.join("uploads", filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    current_user.profile_picture = f"/uploads/{filename}"
    db.commit()
    return {"profile_picture": current_user.profile_picture}
@router.delete("/profile-picture")
def remove_profile_picture(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.profile_picture:
        filename = current_user.profile_picture.split("/")[-1]
        file_path = os.path.join("uploads", filename)
        if os.path.exists(file_path):
            os.remove(file_path)
        current_user.profile_picture = None
        db.commit()
    return {"message": "Profile picture removed successfully"}