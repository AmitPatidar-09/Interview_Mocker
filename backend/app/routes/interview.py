"""
Interview routes — start, submit answers, complete, and view history.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.user import User
from ..models.interview import Interview, InterviewStatus
from ..models.question import Question
from ..models.response import Response
from ..schemas.interview import (
    StartInterviewRequest,
    InterviewResponse,
    QuestionResponse,
    EvaluateAnswerRequest,
    EvaluateAnswerResponse,
    EvaluationResult,
    InterviewSessionState,
    InterviewMessage,
    InterviewDetailResponse,
    QuestionWithResponse,
    ResponseDetail,
    CompleteInterviewRequest,
)
from ..services.interview_service import generate_next_question, evaluate_answer, complete_interview, _update_analytics
from ..utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/interviews", tags=["interviews"])


# ──────────────────── Helpers ────────────────────

def _get_interview_or_404(db: Session, interview_id: int, user_id: int) -> Interview:
    iv = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == user_id,
    ).first()
    if not iv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
    return iv


# ──────────────────── List (for resume support) ────────────────────

@router.get("", response_model=List[InterviewResponse])
async def list_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all interviews for the current user, newest first."""
    interviews = (
        db.query(Interview)
        .filter(Interview.user_id == current_user.id)
        .order_by(Interview.created_at.desc())
        .all()
    )
    return [InterviewResponse.model_validate(iv) for iv in interviews]


# ──────────────────── Start ────────────────────

@router.post("/start", response_model=dict, status_code=status.HTTP_201_CREATED)
async def start_interview(
    payload: StartInterviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new interview session and generate the first question.
    """
    interview = Interview(
        user_id=current_user.id,
        interview_type=payload.interview_type,
        difficulty=payload.difficulty,
        company_mode=payload.company_mode,
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)

    first_question = await generate_next_question(db, interview)

    return {
        "interview": InterviewResponse.model_validate(interview),
        "first_question": QuestionResponse.model_validate(first_question) if first_question else None,
    }


# ──────────────────── Session State ────────────────────

@router.get("/{interview_id}/session", response_model=InterviewSessionState)
async def get_session(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the full session state for an in-progress interview."""
    interview = _get_interview_or_404(db, interview_id, current_user.id)

    questions = (
        db.query(Question)
        .filter(Question.interview_id == interview_id)
        .order_by(Question.order_index)
        .all()
    )

    messages: List[InterviewMessage] = []
    current_question = None

    for q in questions:
        messages.append(
            InterviewMessage(role="question", content=q.content, order_index=q.order_index)
        )
        if q.response:
            messages.append(
                InterviewMessage(
                    role="answer",
                    content=q.response.answer_text,
                    score=q.response.score,
                    order_index=q.order_index,
                )
            )
        else:
            current_question = q

    return InterviewSessionState(
        interview=InterviewResponse.model_validate(interview),
        messages=messages,
        current_question=QuestionResponse.model_validate(current_question) if current_question else None,
    )


# ──────────────────── Evaluate Answer ────────────────────

@router.post("/evaluate", response_model=EvaluateAnswerResponse)
async def evaluate(
    payload: EvaluateAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit an answer for evaluation. Returns the evaluation result and the next question
    (if the interview is not yet at max questions).
    """
    interview = _get_interview_or_404(db, payload.interview_id, current_user.id)

    if interview.status != InterviewStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview is not in progress",
        )

    question = db.query(Question).filter(
        Question.id == payload.question_id,
        Question.interview_id == interview.id,
    ).first()
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    if question.response:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This question has already been answered",
        )

    response = await evaluate_answer(db, interview, question, payload.answer_text)
    next_question = await generate_next_question(db, interview)

    return EvaluateAnswerResponse(
        response_id=response.id,
        question_id=question.id,
        evaluation=EvaluationResult(
            score=response.score,
            strengths=response.strengths or [],
            weaknesses=response.weaknesses or [],
            ideal_answer=response.ideal_answer or "",
            follow_up_question=response.follow_up_question or "",
        ),
        next_question=QuestionResponse.model_validate(next_question) if next_question else None,
    )


# ──────────────────── Complete ────────────────────

@router.post("/complete", response_model=InterviewResponse)
async def complete(
    payload: CompleteInterviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark an interview as completed and compute the final score."""
    interview = _get_interview_or_404(db, payload.interview_id, current_user.id)

    if interview.status != InterviewStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview is not in progress",
        )

    interview = await complete_interview(db, interview)
    return InterviewResponse.model_validate(interview)


# ──────────────────── Detail / History ────────────────────

@router.get("/{interview_id}", response_model=InterviewDetailResponse)
async def get_interview_detail(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the full breakdown of a completed (or in-progress) interview."""
    interview = _get_interview_or_404(db, interview_id, current_user.id)

    questions = (
        db.query(Question)
        .filter(Question.interview_id == interview_id)
        .order_by(Question.order_index)
        .all()
    )

    question_details: List[QuestionWithResponse] = []
    for q in questions:
        resp_detail = None
        if q.response:
            resp_detail = ResponseDetail(
                id=q.response.id,
                answer_text=q.response.answer_text,
                score=q.response.score,
                strengths=q.response.strengths,
                weaknesses=q.response.weaknesses,
                ideal_answer=q.response.ideal_answer,
                follow_up_question=q.response.follow_up_question,
                created_at=q.response.created_at,
            )
        question_details.append(
            QuestionWithResponse(
                id=q.id,
                content=q.content,
                order_index=q.order_index,
                category=q.category,
                response=resp_detail,
            )
        )

    return InterviewDetailResponse(
        id=interview.id,
        interview_type=interview.interview_type,
        difficulty=interview.difficulty,
        company_mode=interview.company_mode,
        status=interview.status,
        overall_score=interview.overall_score,
        total_questions=interview.total_questions,
        created_at=interview.created_at,
        completed_at=interview.completed_at,
        questions=question_details,
    )


# ──────────────────── Delete ────────────────────

@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Permanently delete an interview and all its questions, responses, and submissions."""
    interview = _get_interview_or_404(db, interview_id, current_user.id)
    db.delete(interview)
    db.commit()

    # Fix #12: Recalculate analytics after deletion so stats stay accurate
    await _update_analytics(db, current_user.id)
