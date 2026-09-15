import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from .database import get_db
from .models import User, PasswordResetToken
from .schemas import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    VerifyResetTokenResponse,
)
from .auth import hash_password

router = APIRouter(tags=["Password Reset"])


def _mask_email(email: str) -> str:
    """Mask email for privacy e.g. p***@gmail.com"""
    if not email or "@" not in email:
        return "***"
    user_part, domain = email.split("@", 1)
    if len(user_part) <= 2:
        masked_user = user_part[0] + "***"
    else:
        masked_user = user_part[0] + "***" + user_part[-1]
    return f"{masked_user}@{domain}"


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Request a password reset link.
    Generates a secure, 15-minute token and stores its SHA-256 hash in the database.
    Does not leak whether the email is registered to prevent user enumeration.
    """
    clean_email = data.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == clean_email).first()

    if not user:
        # Return generic message to prevent email enumeration
        return ForgotPasswordResponse(
            message="If your email is registered with SwipeX, you will receive password reset instructions.",
            reset_token=None,
            reset_url=None,
        )

    # Invalidate any previously unused reset tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.user_id,
        PasswordResetToken.is_used == False
    ).update({"is_used": True})

    # Generate a cryptographically secure random token (32 bytes URL safe)
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

    reset_record = PasswordResetToken(
        user_id=user.user_id,
        token_hash=token_hash,
        expires_at=expires_at,
        is_used=False,
    )
    db.add(reset_record)
    db.commit()

    return ForgotPasswordResponse(
        message="If your email is registered with SwipeX, you will receive password reset instructions.",
        reset_token=raw_token,
        reset_url=f"/reset-password?token={raw_token}",
    )


@router.get("/verify-reset-token", response_model=VerifyResetTokenResponse)
def verify_reset_token(
    token: str = Query(..., description="Password reset token"),
    db: Session = Depends(get_db)
):
    """
    Verify if a password reset token is valid and unexpired before presenting the reset form.
    """
    if not token or len(token.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Invalid password reset token."
        )

    token_hash = hashlib.sha256(token.strip().encode("utf-8")).hexdigest()

    record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.is_used == False
    ).first()

    if not record:
        raise HTTPException(
            status_code=400,
            detail="Invalid or already used password reset link."
        )

    # Check expiration
    now = datetime.now(timezone.utc)
    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now:
        raise HTTPException(
            status_code=400,
            detail="This password reset link has expired. Please request a new one."
        )

    user = db.query(User).filter(User.user_id == record.user_id).first()
    email_masked = _mask_email(user.email) if user else None

    return VerifyResetTokenResponse(
        valid=True,
        email_masked=email_masked,
    )


@router.post("/reset-password", response_model=ResetPasswordResponse)
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Reset user password using a verified token.
    Validates matching passwords, min length, token validity, and updates password hash.
    Invalidates the token immediately.
    """
    if data.new_password != data.confirm_password:
        raise HTTPException(
            status_code=400,
            detail="New password and confirmation password do not match."
        )

    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters long."
        )

    raw_token = data.token.strip()
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.is_used == False
    ).first()

    if not record:
        raise HTTPException(
            status_code=400,
            detail="Invalid or already used password reset token. Please request a new link."
        )

    # Check expiration
    now = datetime.now(timezone.utc)
    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now:
        raise HTTPException(
            status_code=400,
            detail="Password reset token has expired. Please request a new link."
        )

    user = db.query(User).filter(User.user_id == record.user_id).first()
    if not user:
        raise HTTPException(
            status_code=400,
            detail="User associated with this reset token could not be found."
        )

    # Update password securely with existing password hashing
    user.password_hash = hash_password(data.new_password)

    # Mark token as used to prevent replay attacks
    record.is_used = True

    db.commit()

    return ResetPasswordResponse(
        message="Your password has been successfully reset. You can now log in with your new password."
    )

