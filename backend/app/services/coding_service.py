"""
Coding service — DSA problem generation, code run/submit with Judge0 + Gemini review.
"""

from sqlalchemy.orm import Session

from ..models.coding_submission import CodingSubmission
from ..models.interview import Interview
from ..models.question_bank import QuestionBank
from ..prompts.templates import dsa_problem_generation_prompt, code_review_prompt
from .ai_service import generate_json
import radon.complexity as radon_cc
from radon.visitors import ComplexityVisitor
from .judge0_service import run_code, run_test_cases
from typing import Dict, Any, List, Optional


async def generate_dsa_problem(db: Session, difficulty: str, company_mode: str) -> Dict[str, Any]:
    """Generate a full DSA problem from QuestionBank or fallback to Gemini."""
    qb = db.query(QuestionBank).filter(
        QuestionBank.interview_type == "DSA",
        QuestionBank.difficulty == difficulty,
        QuestionBank.company_mode == company_mode
    ).first()

    if qb:
        import json
        try:
            return json.loads(qb.content)
        except Exception:
            return {"title": "Problem", "problem_statement": qb.content}

    prompt = dsa_problem_generation_prompt(difficulty=difficulty, company_mode=company_mode)
    return await generate_json(prompt)


async def execute_code(
    language: str,
    source_code: str,
    stdin: str = "",
) -> Dict[str, Any]:
    """Run code once (plain run, no test cases)."""
    return await run_code(language=language, source_code=source_code, stdin=stdin)


async def submit_and_review(
    db: Session,
    interview: Interview,
    problem_title: str,
    problem_statement: str,
    language: str,
    source_code: str,
    test_cases: Optional[List[Dict]] = None,
    request_ai_review: bool = False,
) -> CodingSubmission:
    """
    1. Run code against all test cases via Judge0.
    2. Perform static analysis OR get AI code review if requested.
    3. Persist and return the CodingSubmission.
    """
    if test_cases is None:
        test_cases = []

    # Step 1: Execute
    exec_result = await run_test_cases(
        language=language,
        source_code=source_code,
        test_cases=test_cases,
    )

    # Step 2: AI review or Static Analysis
    review = {}
    if request_ai_review:
        prompt = code_review_prompt(
            problem_statement=problem_statement,
            language=language,
            source_code=source_code,
            judge0_result={
                "status": exec_result.get("status", "Unknown"),
                "stdout": exec_result.get("stdout", ""),
                "stderr": exec_result.get("stderr", ""),
                "time": exec_result.get("time"),
                "memory": exec_result.get("memory"),
                "passed_cases": exec_result.get("passed_cases", 0),
                "total_cases": exec_result.get("total_cases", 0),
            },
        )
        review = await generate_json(prompt, db=db, user_id=interview.user_id, endpoint="dsa_review")
    else:
        # Use static analysis if python
        if language.lower() in ["python", "python3"]:
            try:
                v = ComplexityVisitor.from_code(source_code)
                complexities = [func.complexity for func in v.functions]
                avg_complexity = sum(complexities) / len(complexities) if complexities else 1
                review = {
                    "correctness_score": (exec_result.get("passed_cases", 0) / max(exec_result.get("total_cases", 1), 1)) * 10,
                    "time_complexity": f"Cyclomatic Complexity: {avg_complexity:.1f}",
                    "space_complexity": "Estimated: O(N) or based on memory used",
                    "strengths": ["Passed basic static analysis."] if avg_complexity < 10 else [],
                    "weaknesses": ["High cyclomatic complexity. Needs refactoring."] if avg_complexity >= 10 else [],
                    "optimization_suggestions": ["Break down functions to reduce complexity."] if avg_complexity >= 10 else []
                }
            except Exception:
                pass

    # Step 3: Persist
    submission = CodingSubmission(
        interview_id=interview.id,
        problem_title=problem_title,
        problem_statement=problem_statement,
        language=language,
        code=source_code,
        judge0_status=exec_result.get("status"),
        stdout=exec_result.get("stdout"),
        stderr=exec_result.get("stderr"),
        compile_output=exec_result.get("compile_output"),
        time_used=exec_result.get("time"),
        memory_used=exec_result.get("memory"),
        passed_cases=exec_result.get("passed_cases", 0),
        total_cases=exec_result.get("total_cases", 0),
        correctness_score=float(review.get("correctness_score", 0)),
        time_complexity=review.get("time_complexity", ""),
        space_complexity=review.get("space_complexity", ""),
        code_strengths=review.get("strengths", []),
        code_weaknesses=review.get("weaknesses", []),
        optimization_suggestions=review.get("optimization_suggestions", []),
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    return submission
