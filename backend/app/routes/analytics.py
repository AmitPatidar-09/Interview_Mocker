"""
Analytics routes — dashboard stats and interview history.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..schemas.analytics import AnalyticsResponse, HistoryListResponse
from ..services.analytics_service import get_analytics, get_history
from ..utils.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard", response_model=AnalyticsResponse)
async def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return full analytics dashboard data for the current user:
    overall stats, per-topic scores, weak/strong areas, recent interviews, and score trend.
    """
    return get_analytics(db, current_user.id)


@router.get("/history", response_model=HistoryListResponse)
async def history(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Paginated list of all interviews for the current user."""
    return get_history(db, current_user.id, page=page, per_page=per_page)
