from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime


class TopicScore(BaseModel):
    topic: str
    average_score: float
    total_interviews: int


class RecentInterview(BaseModel):
    id: int
    interview_type: str
    difficulty: str
    company_mode: str
    overall_score: Optional[float]
    total_questions: int
    created_at: datetime
    status: str


class AnalyticsResponse(BaseModel):
    total_interviews: int
    total_questions_answered: int
    average_score: float
    topic_scores: Dict[str, float]
    weak_areas: List[str]
    strong_areas: List[str]
    recent_interviews: List[RecentInterview]
    score_trend: List[dict]   # [{date, score}]


class HistoryListResponse(BaseModel):
    interviews: List[RecentInterview]
    total: int
    page: int
    per_page: int
