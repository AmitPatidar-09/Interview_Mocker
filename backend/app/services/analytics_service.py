"""
Analytics service — fetch and format analytics / history data.
"""

from typing import List
from sqlalchemy.orm import Session

from ..models.analytics import Analytics
from ..models.interview import Interview, InterviewStatus
from ..schemas.analytics import AnalyticsResponse, RecentInterview, HistoryListResponse


def get_or_create_analytics(db: Session, user_id: int) -> Analytics:
    analytics = db.query(Analytics).filter(Analytics.user_id == user_id).first()
    if not analytics:
        analytics = Analytics(user_id=user_id)
        db.add(analytics)
        db.commit()
        db.refresh(analytics)
    return analytics


def get_analytics(db: Session, user_id: int) -> AnalyticsResponse:
    analytics = get_or_create_analytics(db, user_id)

    # Recent interviews (last 5, any status)
    recent = (
        db.query(Interview)
        .filter(Interview.user_id == user_id)
        .order_by(Interview.created_at.desc())
        .limit(5)
        .all()
    )
    recent_list: List[RecentInterview] = [
        RecentInterview(
            id=iv.id,
            interview_type=iv.interview_type.value,
            difficulty=iv.difficulty.value,
            company_mode=iv.company_mode,
            overall_score=iv.overall_score,
            total_questions=iv.total_questions,
            created_at=iv.created_at,
            status=iv.status.value,
        )
        for iv in recent
    ]

    # Score trend — last 10 completed interviews
    completed = (
        db.query(Interview)
        .filter(
            Interview.user_id == user_id,
            Interview.status == InterviewStatus.COMPLETED,
            Interview.overall_score.isnot(None),
        )
        .order_by(Interview.completed_at.desc())
        .limit(10)
        .all()
    )
    score_trend = [
        {"date": iv.completed_at.isoformat(), "score": iv.overall_score}
        for iv in reversed(completed)
        if iv.completed_at
    ]

    return AnalyticsResponse(
        total_interviews=analytics.total_interviews,
        total_questions_answered=analytics.total_questions_answered,
        average_score=analytics.average_score,
        topic_scores=analytics.topic_scores or {},
        weak_areas=analytics.weak_areas or [],
        strong_areas=analytics.strong_areas or [],
        recent_interviews=recent_list,
        score_trend=score_trend,
    )


def get_history(
    db: Session,
    user_id: int,
    page: int = 1,
    per_page: int = 10,
) -> HistoryListResponse:
    offset = (page - 1) * per_page
    total = db.query(Interview).filter(Interview.user_id == user_id).count()
    interviews = (
        db.query(Interview)
        .filter(Interview.user_id == user_id)
        .order_by(Interview.created_at.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )
    items = [
        RecentInterview(
            id=iv.id,
            interview_type=iv.interview_type.value,
            difficulty=iv.difficulty.value,
            company_mode=iv.company_mode,
            overall_score=iv.overall_score,
            total_questions=iv.total_questions,
            created_at=iv.created_at,
            status=iv.status.value,
        )
        for iv in interviews
    ]
    return HistoryListResponse(interviews=items, total=total, page=page, per_page=per_page)
