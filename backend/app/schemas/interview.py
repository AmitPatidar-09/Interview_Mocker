from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from ..models.interview import InterviewType, Difficulty, InterviewStatus


# ──────────────────── Interview ────────────────────

class StartInterviewRequest(BaseModel):
    interview_type: InterviewType
    difficulty: Difficulty
    company_mode: str = "Generic"


class InterviewResponse(BaseModel):
    id: int
    interview_type: InterviewType
    difficulty: Difficulty
    company_mode: str
    status: InterviewStatus
    overall_score: Optional[float] = None
    total_questions: int
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ──────────────────── Question ────────────────────

class QuestionResponse(BaseModel):
    id: int
    interview_id: int
    content: str
    order_index: int
    category: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ──────────────────── Evaluation ────────────────────

class EvaluateAnswerRequest(BaseModel):
    interview_id: int
    question_id: int
    answer_text: str = Field(..., min_length=1)


class EvaluationResult(BaseModel):
    score: float = Field(..., ge=0, le=10)
    strengths: List[str]
    weaknesses: List[str]
    ideal_answer: str
    follow_up_question: str


class EvaluateAnswerResponse(BaseModel):
    response_id: int
    question_id: int
    evaluation: EvaluationResult
    next_question: Optional[QuestionResponse] = None


# ──────────────────── Session (context-aware) ────────────────────

class InterviewMessage(BaseModel):
    role: str   # "question" | "answer"
    content: str
    score: Optional[float] = None
    order_index: int


class InterviewSessionState(BaseModel):
    interview: InterviewResponse
    messages: List[InterviewMessage]
    current_question: Optional[QuestionResponse] = None


# ──────────────────── History Detail ────────────────────

class ResponseDetail(BaseModel):
    id: int
    answer_text: str
    score: Optional[float]
    strengths: Optional[List[str]]
    weaknesses: Optional[List[str]]
    ideal_answer: Optional[str]
    follow_up_question: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionWithResponse(BaseModel):
    id: int
    content: str
    order_index: int
    category: Optional[str]
    response: Optional[ResponseDetail]

    class Config:
        from_attributes = True


class InterviewDetailResponse(BaseModel):
    id: int
    interview_type: InterviewType
    difficulty: Difficulty
    company_mode: str
    status: InterviewStatus
    overall_score: Optional[float]
    total_questions: int
    created_at: datetime
    completed_at: Optional[datetime]
    questions: List[QuestionWithResponse]

    class Config:
        from_attributes = True


class CompleteInterviewRequest(BaseModel):
    interview_id: int
