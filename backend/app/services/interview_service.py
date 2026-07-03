"""
Interview service — business logic for question generation, evaluation, and completion.
Uses the unified ai_service for all AI calls (Ollama / Groq / Gemini).
"""

from typing import List, Optional, Dict
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from ..models.interview import Interview, InterviewType, Difficulty, InterviewStatus
from ..models.question import Question
from ..models.response import Response
from ..models.analytics import Analytics
from ..models.question_bank import QuestionBank
from ..prompts.templates import (
    question_generation_prompt,
    answer_evaluation_prompt,
    weak_topic_detection_prompt,
)
from .ai_service import generate_json


# ──────────────────── Question Generation ────────────────────

async def generate_next_question(
    db: Session,
    interview: Interview,
    max_questions: int = 10,
) -> Optional[Question]:
    """
    Generate and persist the next question for *interview*.
    Returns None when the interview has hit *max_questions*.

    Priority:
      1. QuestionBank — exact match (type + difficulty + company)
      2. QuestionBank — type-only fallback
      3. AI generation (Ollama / Groq / Gemini via ai_service)

    Uniqueness: All three paths exclude already-asked question content.
    """
    existing_questions = (
        db.query(Question)
        .filter(Question.interview_id == interview.id)
        .order_by(Question.order_index)
        .all()
    )

    if len(existing_questions) >= max_questions:
        return None

    asked_contents = [q.content for q in existing_questions]
    # Normalised set for similarity checks (lowercase, stripped)
    asked_normalised = {c.lower().strip() for c in asked_contents}

    # 1. Exact match from QuestionBank
    qb_query = db.query(QuestionBank).filter(
        QuestionBank.interview_type == interview.interview_type.value,
        QuestionBank.difficulty == interview.difficulty.value,
        QuestionBank.company_mode == interview.company_mode,
    )
    if asked_contents:
        qb_query = qb_query.filter(QuestionBank.content.notin_(asked_contents))
    next_qb = qb_query.first()

    # 2. Type-only fallback
    if not next_qb:
        qb_fallback = db.query(QuestionBank).filter(
            QuestionBank.interview_type == interview.interview_type.value
        )
        if asked_contents:
            qb_fallback = qb_fallback.filter(QuestionBank.content.notin_(asked_contents))
        next_qb = qb_fallback.first()

    # 3. AI generation with uniqueness retry
    if not next_qb:
        content, category = await _generate_unique_ai_question(
            interview, asked_contents, asked_normalised
        )
    else:
        content = next_qb.content
        category = next_qb.category

    question = Question(
        interview_id=interview.id,
        content=content,
        order_index=len(existing_questions),
        category=category,
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    # Update total_questions count
    interview.total_questions = len(existing_questions) + 1
    db.commit()

    return question


def _is_too_similar(candidate: str, asked_normalised: set, threshold: float = 0.7) -> bool:
    """
    Return True if *candidate* is suspiciously close to any already-asked question.
    Uses a simple word-overlap (Jaccard) heuristic — fast, no extra dependencies.
    """
    c_words = set(candidate.lower().strip().split())
    if not c_words:
        return False
    for asked in asked_normalised:
        a_words = set(asked.split())
        if not a_words:
            continue
        intersection = len(c_words & a_words)
        union = len(c_words | a_words)
        if union and (intersection / union) >= threshold:
            return True
    return False


async def _generate_unique_ai_question(
    interview: Interview,
    asked_contents: list,
    asked_normalised: set,
    max_retries: int = 3,
) -> tuple:
    """
    Ask the AI for a question, retrying up to *max_retries* times if it
    produces something too similar to an already-asked question.
    """
    from ..prompts.templates import question_generation_prompt  # already at module top but safe here

    for attempt in range(max_retries):
        prompt = question_generation_prompt(
            interview_type=interview.interview_type.value,
            difficulty=interview.difficulty.value,
            company_mode=interview.company_mode,
            previous_questions=asked_contents,
        )
        try:
            data = await generate_json(prompt)
            content = data.get("question", "").strip()
            category = data.get("category", "General")

            if content and not _is_too_similar(content, asked_normalised):
                return content, category

            print(f"[interview_service] AI returned similar question on attempt {attempt + 1}, retrying…")
        except Exception as e:
            print(f"[interview_service] AI question generation failed (attempt {attempt + 1}): {e}")

    # Exhausted retries — use a safe generic fallback
    fallback_content = (
        f"Describe a unique {interview.interview_type.value} challenge "
        f"you haven't covered yet and how you approached it."
    )
    return fallback_content, "General"



# ──────────────────── Answer Evaluation ────────────────────

async def evaluate_answer(
    db: Session,
    interview: Interview,
    question: Question,
    answer_text: str,
) -> Response:
    """
    Evaluate *answer_text* for *question* using the configured AI provider.
    Persists the Response and updates the running summary.
    """
    # Pass running_summary directly into prompt for context (token-efficient)
    prompt = answer_evaluation_prompt(
        question=question.content,
        answer=answer_text,
        interview_type=interview.interview_type.value,
        difficulty=interview.difficulty.value,
        running_summary=interview.running_summary or "",
    )

    try:
        data = await generate_json(prompt)
    except Exception as e:
        print(f"[interview_service] AI answer evaluation failed: {e}")
        data = {
            "score": 5.0,
            "strengths": ["Answer recorded"],
            "weaknesses": ["AI evaluation temporarily unavailable — check provider config"],
            "ideal_answer": "",
        }

    response = Response(
        question_id=question.id,
        answer_text=answer_text,
        score=float(data.get("score", 0.0)),
        strengths=data.get("strengths", []),
        weaknesses=data.get("weaknesses", []),
        ideal_answer=data.get("ideal_answer", ""),
        follow_up_question=data.get("follow_up_question", ""),
        ai_model_used=_get_model_label(),
    )
    db.add(response)
    db.commit()
    db.refresh(response)

    # Update running summary (compact single call, not a separate AI round-trip)
    _update_running_summary(interview, question.content, answer_text, response.score, db)

    return response


def _update_running_summary(
    interview: Interview,
    question: str,
    answer: str,
    score: float,
    db: Session,
) -> None:
    """
    Append a short summary entry to the interview's running_summary.
    Done locally — no AI call — to save tokens.
    """
    entry = f"Q: {question[:80]} | Score: {score}/10"
    existing = interview.running_summary or ""
    # Keep only last 500 chars to avoid bloating future prompts
    combined = (existing + "\n" + entry).strip()
    if len(combined) > 500:
        combined = combined[-500:]
    interview.running_summary = combined
    db.commit()


def _get_model_label() -> str:
    """Return a human-readable label for the active AI provider/model."""
    from ..config import settings
    provider = settings.AI_PROVIDER.lower()
    if provider == "ollama":
        return f"ollama:{settings.OLLAMA_MODEL}"
    if provider == "groq":
        return f"groq:{settings.GROQ_MODEL}"
    return f"gemini:{settings.GEMINI_MODEL}"


# ──────────────────── Complete Interview ────────────────────

async def complete_interview(db: Session, interview: Interview) -> Interview:
    """
    Mark interview as completed, compute overall_score, and update analytics.
    """
    responses = (
        db.query(Response)
        .join(Question, Response.question_id == Question.id)
        .filter(Question.interview_id == interview.id)
        .all()
    )

    scores = [r.score for r in responses if r.score is not None]
    overall = round(sum(scores) / len(scores), 2) if scores else 0.0

    interview.overall_score = overall
    interview.status = InterviewStatus.COMPLETED
    interview.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(interview)

    await _update_analytics(db, interview.user_id, interview, responses)
    return interview


# ──────────────────── Analytics Update ────────────────────

async def _update_analytics(
    db: Session,
    user_id: int,
    interview: Interview,
    responses: List[Response],
) -> None:
    """Recalculate and persist Analytics for the given user."""
    analytics = db.query(Analytics).filter(Analytics.user_id == user_id).first()
    if not analytics:
        analytics = Analytics(user_id=user_id)
        db.add(analytics)
        db.flush()

    all_interviews = (
        db.query(Interview)
        .filter(
            Interview.user_id == user_id,
            Interview.status == InterviewStatus.COMPLETED,
        )
        .all()
    )

    total_interviews = len(all_interviews)
    all_scores: List[float] = []
    topic_scores_raw: Dict[str, List[float]] = {}
    total_questions_answered = 0

    for iv in all_interviews:
        iv_responses = (
            db.query(Response)
            .join(Question, Response.question_id == Question.id)
            .filter(Question.interview_id == iv.id)
            .all()
        )
        iv_questions = db.query(Question).filter(Question.interview_id == iv.id).all()
        total_questions_answered += len(iv_responses)

        for resp in iv_responses:
            if resp.score is not None:
                all_scores.append(resp.score)
                q = next((q for q in iv_questions if q.id == resp.question_id), None)
                topic = (q.category or iv.interview_type.value) if q else iv.interview_type.value
                topic_scores_raw.setdefault(topic, []).append(resp.score)

    analytics.total_interviews = total_interviews
    analytics.total_questions_answered = total_questions_answered
    analytics.average_score = round(sum(all_scores) / len(all_scores), 2) if all_scores else 0.0

    topic_scores: Dict[str, float] = {
        t: round(sum(v) / len(v), 2) for t, v in topic_scores_raw.items()
    }
    analytics.topic_scores = topic_scores

    # Only call AI for area classification if we have enough data (saves tokens)
    if topic_scores and total_interviews >= 2:
        try:
            prompt = weak_topic_detection_prompt(topic_scores)
            result = await generate_json(prompt)
            analytics.weak_areas = result.get("weak_areas", [])
            analytics.strong_areas = result.get("strong_areas", [])
        except Exception as e:
            print(f"[interview_service] AI area classification failed: {e}")
            analytics.weak_areas = [t for t, s in topic_scores.items() if s < 5.5]
            analytics.strong_areas = [t for t, s in topic_scores.items() if s >= 7.5]
    elif topic_scores:
        # Simple threshold for first interview — no AI call needed
        analytics.weak_areas = [t for t, s in topic_scores.items() if s < 5.5]
        analytics.strong_areas = [t for t, s in topic_scores.items() if s >= 7.5]

    db.commit()
