import re

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..auth import (
    hash_password,
    verify_password,
    create_access_token
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


# ==========================================
# EMAIL VALIDATION
# ==========================================

def validate_email(email: str):

    email_pattern = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"

    if not re.match(email_pattern, email):

        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address"
        )


# ==========================================
# MOBILE NUMBER VALIDATION
# ==========================================

def validate_phone(phone: str):

    if not re.fullmatch(r"[0-9]{10}", phone):

        raise HTTPException(
            status_code=400,
            detail="Mobile number must contain exactly 10 digits"
        )


# ==========================================
# PASSWORD VALIDATION
# ==========================================

def validate_password(password: str):

    if len(password) < 8:

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 8 characters"
        )

    if not re.search(r"[A-Z]", password):

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one uppercase letter"
        )

    if not re.search(r"[a-z]", password):

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one lowercase letter"
        )

    if not re.search(r"[0-9]", password):

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one number"
        )

    if not re.search(
        r"[!@#$%^&*(),.?\":{}|<>_\-+=/\\[\];']",
        password
    ):

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one special character"
        )


# ==========================================
# REGISTER
# ==========================================

@router.post("/register")
def register(
    full_name: str,
    email: str,
    password: str,
    phone: str,
    db: Session = Depends(get_db)
):

    # --------------------------------------
    # Clean input
    # --------------------------------------

    full_name = full_name.strip()
    email = email.strip().lower()
    phone = phone.strip()

    # --------------------------------------
    # Validate email
    # --------------------------------------

    validate_email(email)

    # --------------------------------------
    # Validate mobile number
    # --------------------------------------

    validate_phone(phone)

    # --------------------------------------
    # Validate password
    # --------------------------------------

    validate_password(password)

    # --------------------------------------
    # Check duplicate email
    # --------------------------------------

    existing_email = db.query(User).filter(
        User.email == email
    ).first()

    if existing_email:

        raise HTTPException(
            status_code=400,
            detail="Candidate already exists with this email"
        )

    # --------------------------------------
    # Check duplicate mobile number
    # --------------------------------------

    existing_phone = db.query(User).filter(
        User.phone == phone
    ).first()

    if existing_phone:

        raise HTTPException(
            status_code=400,
            detail="Candidate already exists with this mobile number"
        )

    # --------------------------------------
    # Create candidate
    # --------------------------------------

    user = User(
        full_name=full_name,
        email=email,
        password_hash=hash_password(password),
        phone=phone,
        role="candidate"
    )

    db.add(user)

    db.commit()

    db.refresh(user)

    return {
        "message": "Candidate registered successfully",
        "user_id": user.user_id
    }


# ==========================================
# LOGIN
# ==========================================

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    # OAuth2 username = candidate email
    email = form_data.username.strip().lower()

    # --------------------------------------
    # Find candidate
    # --------------------------------------

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # --------------------------------------
    # Verify password
    # --------------------------------------

    if not verify_password(
        form_data.password,
        user.password_hash
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # --------------------------------------
    # Generate JWT
    # --------------------------------------

    access_token = create_access_token(
        user.user_id,
        user.role
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.user_id,
        "role": user.role
    }