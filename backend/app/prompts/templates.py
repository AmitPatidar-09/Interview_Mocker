"""
Token-efficient prompt templates for InterviewAce AI.
All prompts return a structured JSON object.
Optimized to minimize token usage while preserving response quality.
"""

from typing import List, Dict, Optional


def question_generation_prompt(
    interview_type: str,
    difficulty: str,
    company_mode: str,
    previous_questions: Optional[List[str]] = None,
) -> str:
    # Fix #13: Build prompt with correct ordering — previously asked come BEFORE the instruction
    prev = ""
    if previous_questions:
        # Send ALL previous questions so the AI never repeats any of them
        prev = (
            "ALREADY ASKED (you MUST NOT repeat or rephrase any of these):\n"
            + "\n".join(f"- {q[:80]}" for q in previous_questions)
            + "\n\n"
        )

    company = f"Style: {company_mode} interview.\n" if company_mode != "Generic" else ""

    return (
        f"{prev}"  # Fix #13: Previous questions come FIRST
        f"{company}"
        f"Generate one UNIQUE {difficulty} {interview_type} interview question "
        f"that is completely different from any question listed above.\n"
        f'Return JSON: {{"question":"...","category":"sub-topic"}}'
    )


def answer_evaluation_prompt(
    question: str,
    answer: str,
    interview_type: str,
    difficulty: str,
    running_summary: str = "",
) -> str:
    context = f"Candidate context: {running_summary[:300]}\n" if running_summary else ""
    return (
        f"Evaluate this {difficulty} {interview_type} interview answer.\n"
        f"{context}"
        f"Q: {question}\n"
        f"A: {answer}\n\n"
        f"Score 0-10 on accuracy, depth, clarity.\n"
        f'Return JSON: {{"score":7,"strengths":["..."],"weaknesses":["..."],"ideal_answer":"brief model answer"}}'
    )


def code_review_prompt(
    problem_statement: str,
    language: str,
    source_code: str,
    judge0_result: Dict,
) -> str:
    # Truncate large code/output to limit tokens
    code_snippet = source_code[:1500] + ("..." if len(source_code) > 1500 else "")
    status = judge0_result.get("status", "Unknown")
    passed = judge0_result.get("passed_cases", 0)
    total = judge0_result.get("total_cases", 0)
    time_used = judge0_result.get("time", "N/A")

    return (
        f"Review this {language} solution for a coding interview.\n"
        f"Problem: {problem_statement[:400]}\n"
        f"Status: {status} ({passed}/{total} cases). Time: {time_used}s\n"
        f"Code:\n```\n{code_snippet}\n```\n"
        f'Return JSON: {{"correctness_score":7.5,"time_complexity":"O(n)","space_complexity":"O(1)",'
        f'"strengths":["..."],"weaknesses":["..."],"optimization_suggestions":["..."]}}'
    )


def weak_topic_detection_prompt(topic_scores: Dict[str, float]) -> str:
    scores_str = ", ".join(f"{t}:{s:.1f}" for t, s in topic_scores.items())
    return (
        f"Topic scores (out of 10): {scores_str}\n"
        f"weak=<5.5, strong=>=7.5\n"
        f'Return JSON: {{"weak_areas":["..."],"strong_areas":["..."]}}'
    )


def dsa_problem_generation_prompt(difficulty: str, company_mode: str) -> str:
    company = f"Match {company_mode} style. " if company_mode != "Generic" else ""
    return (
        f"Generate a complete {difficulty} DSA coding problem. {company}\n"
        f"Return JSON:\n"
        '{"title":"...","description":"full problem with examples","examples":'
        '[{"input":"...","output":"...","explanation":"..."}],'
        '"constraints":["..."],'
        '"starter_code":{"python":"def solution(...):\\n    pass",'
        '"java":"class Solution {\\n    public ... solution(...) {}\\n}",'
        '"cpp":"class Solution {\\npublic:\\n    ... solution(...) {}\\n};"},'
        '"test_cases":[{"input":"...","expected_output":"..."}]}'
    )
