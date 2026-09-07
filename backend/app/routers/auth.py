from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)

from sqlalchemy.orm import Session
from pwdlib import PasswordHash

from ..database import get_db
from ..models import User
from ..schemas import (
    UserRegister,
    UserLogin,
    UserResponse,
    Token
)

from ..utils.security import (
    create_access_token,
    verify_access_token
)


# =========================================================
# ROUTER SETUP
# =========================================================

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

password_hash = PasswordHash.recommended()

security = HTTPBearer()


# =========================================================
# REGISTER
# =========================================================

@router.post(
    "/register",
    response_model=UserResponse
)
def register_user(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    # -----------------------------------------------------
    # Check if email already exists
    # -----------------------------------------------------

    existing_user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # -----------------------------------------------------
    # Hash password
    # -----------------------------------------------------

    hashed_password = password_hash.hash(
        user_data.password
    )

    # -----------------------------------------------------
    # Create new user
    # -----------------------------------------------------

    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        password_hash=hashed_password,
        role=user_data.role,
        phone=user_data.phone,
        is_verified=False
    )

    # -----------------------------------------------------
    # Save user to PostgreSQL
    # -----------------------------------------------------

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

    except Exception as e:
        db.rollback()

        print(
            "DATABASE ERROR:",
            repr(e)
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

    # -----------------------------------------------------
    # Return created user
    # -----------------------------------------------------

    return new_user


# =========================================================
# LOGIN
# =========================================================

@router.post(
    "/login",
    response_model=Token
)
def login_user(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    # -----------------------------------------------------
    # Find user by email
    # -----------------------------------------------------

    user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    # -----------------------------------------------------
    # User does not exist
    # -----------------------------------------------------

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # -----------------------------------------------------
    # Verify password
    # -----------------------------------------------------

    if not password_hash.verify(
        user_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # -----------------------------------------------------
    # Create JWT access token
    # -----------------------------------------------------

    access_token = create_access_token(
        data={
            "sub": str(user.user_id),
            "email": user.email,
            "role": user.role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# =========================================================
# GET CURRENT USER
# PROTECTED ENDPOINT
# =========================================================

@router.get(
    "/me",
    response_model=UserResponse
)
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db)
):
    # -----------------------------------------------------
    # Get token from Authorization header
    # -----------------------------------------------------

    token = credentials.credentials

    # -----------------------------------------------------
    # Verify JWT token
    # -----------------------------------------------------

    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    # -----------------------------------------------------
    # Get user ID from JWT
    # -----------------------------------------------------

    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    # -----------------------------------------------------
    # Find user in database
    # -----------------------------------------------------

    user = (
        db.query(User)
        .filter(User.user_id == int(user_id))
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    # -----------------------------------------------------
    # Return current user
    # -----------------------------------------------------

    return user
