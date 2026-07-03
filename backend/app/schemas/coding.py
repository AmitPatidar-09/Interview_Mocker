from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


SUPPORTED_LANGUAGES = {
    "python": 71,
    "javascript": 63,
    "java": 62,
    "cpp": 54,
    "c": 50,
    "typescript": 74,
    "go": 60,
    "rust": 73,
}


class RunCodeRequest(BaseModel):
    language: str = Field(..., description="One of: python, javascript, java, cpp, c, typescript, go, rust")
    source_code: str
    stdin: Optional[str] = ""
    interview_id: Optional[int] = None


class RunCodeResponse(BaseModel):
    status: str
    stdout: Optional[str]
    stderr: Optional[str]
    compile_output: Optional[str]
    time: Optional[float]
    memory: Optional[float]
    message: Optional[str] = None


class SubmitCodeRequest(BaseModel):
    interview_id: int
    problem_title: str
    problem_statement: str
    language: str
    source_code: str
    test_cases: Optional[List[dict]] = []
    request_ai_review: bool = False


class CodeReviewResult(BaseModel):
    correctness_score: float = Field(..., ge=0, le=10)
    time_complexity: str
    space_complexity: str
    strengths: List[str]
    weaknesses: List[str]
    optimization_suggestions: List[str]


class SubmitCodeResponse(BaseModel):
    submission_id: int
    run_result: RunCodeResponse
    passed_cases: int
    total_cases: int
    review: CodeReviewResult
