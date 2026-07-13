"""
Auth routes — register, login, profile management.
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from ..database import get_db
from ..models.user import User
from ..schemas.auth import (
    UserRegister, UserLogin, UserResponse, TokenResponse,
    ChangePasswordRequest, UpdateProfileRequest,
)
from ..utils.auth import hash_password, verify_password, create_access_token, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

# Fix #5: Rate limiting for auth endpoints
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def register(request: Request, payload: UserRegister, db: Session = Depends(get_db)):
    """Register a new user account."""
    if db.query(User).filter(User.email == payload.email).first():
        # Fix #25: Generic message to prevent email enumeration
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed. Please check your details and try again.",
        )
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticate and receive a JWT token."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the current authenticated user's profile."""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_profile(
    payload: UpdateProfileRequest,  # Fix #4: typed Pydantic schema, not raw dict
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update display name or avatar URL."""
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change the current user's password.
    
    Also bumps password_changed_at so older JWTs are implicitly invalidated
    (checked in get_current_user).
    """
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    current_user.hashed_password = hash_password(payload.new_password)
    current_user.password_changed_at = datetime.now(timezone.utc)
    db.commit()
