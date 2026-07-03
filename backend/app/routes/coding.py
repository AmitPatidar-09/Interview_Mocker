"""
Coding routes — DSA problem generation, code run, and code submission.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..models.interview import Interview, InterviewStatus
from ..schemas.coding import (
    RunCodeRequest,
    RunCodeResponse,
    SubmitCodeRequest,
    SubmitCodeResponse,
    CodeReviewResult,
    SUPPORTED_LANGUAGES,
)
from ..services.coding_service import generate_dsa_problem, execute_code, submit_and_review
from ..utils.auth import get_current_user

router = APIRouter(prefix="/coding", tags=["coding"])


@router.get("/problem")
async def get_dsa_problem(
    difficulty: str = "Medium",
    company_mode: str = "Generic",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a new DSA coding problem using Gemini.
    Returns problem details including title, description, examples, constraints,
    starter code in multiple languages, and test cases.
    """
    try:
        problem = await generate_dsa_problem(db=db, difficulty=difficulty, company_mode=company_mode)
        return problem
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate problem: {str(e)}",
        )


@router.post("/run", response_model=RunCodeResponse)
async def run_code_endpoint(
    payload: RunCodeRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Execute code via Judge0 (single run — no test cases evaluated).
    Supports: python, javascript, java, cpp, c, typescript, go, rust.
    """
    if payload.language.lower() not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported language '{payload.language}'. Supported: {list(SUPPORTED_LANGUAGES.keys())}",
        )
    try:
        result = await execute_code(
            language=payload.language,
            source_code=payload.source_code,
            stdin=payload.stdin or "",
        )
        return RunCodeResponse(
            status=result.get("status", "Unknown"),
            stdout=result.get("stdout"),
            stderr=result.get("stderr"),
            compile_output=result.get("compile_output"),
            time=result.get("time"),
            memory=result.get("memory"),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code execution failed: {str(e)}",
        )


@router.post("/submit", response_model=SubmitCodeResponse)
async def submit_code(
    payload: SubmitCodeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit code for evaluation:
    1. Runs against provided test cases via Judge0.
    2. Gets an AI code review from Gemini.
    3. Persists and returns the full result.
    """
    if payload.language.lower() not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported language '{payload.language}'.",
        )

    interview = db.query(Interview).filter(
        Interview.id == payload.interview_id,
        Interview.user_id == current_user.id,
    ).first()
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
    if interview.status != InterviewStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview is not in progress",
        )

    try:
        submission = await submit_and_review(
            db=db,
            interview=interview,
            problem_title=payload.problem_title,
            problem_statement=payload.problem_statement,
            language=payload.language,
            source_code=payload.source_code,
            test_cases=payload.test_cases or [],
            request_ai_review=payload.request_ai_review,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Submission failed: {str(e)}",
        )

    return SubmitCodeResponse(
        submission_id=submission.id,
        run_result=RunCodeResponse(
            status=submission.judge0_status or "Unknown",
            stdout=submission.stdout,
            stderr=submission.stderr,
            compile_output=submission.compile_output,
            time=submission.time_used,
            memory=submission.memory_used,
        ),
        passed_cases=submission.passed_cases,
        total_cases=submission.total_cases,
        review=CodeReviewResult(
            correctness_score=submission.correctness_score or 0.0,
            time_complexity=submission.time_complexity or "",
            space_complexity=submission.space_complexity or "",
            strengths=submission.code_strengths or [],
            weaknesses=submission.code_weaknesses or [],
            optimization_suggestions=submission.optimization_suggestions or [],
        ),
    )
