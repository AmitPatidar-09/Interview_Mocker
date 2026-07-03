"""
Judge0 service — submit code, poll for result, run test cases.

Supports two modes automatically:
  1. RapidAPI mode — when a valid JUDGE0_API_KEY is set in .env
  2. Free CE mode — fallback to https://ce.judge0.com (no key needed)
"""

import httpx
import asyncio
import base64
from typing import Optional, List, Dict, Any
from ..config import settings


# ──────────────────── Auto-detect mode ────────────────────

_PLACEHOLDER_KEYS = {"", "your_rapidapi_key_here", "your_api_key_here"}

def _is_rapidapi_mode() -> bool:
    return settings.JUDGE0_API_KEY.strip() not in _PLACEHOLDER_KEYS

# Free Judge0 CE endpoint (no authentication required)
FREE_CE_URL = "https://ce.judge0.com"

def _get_base_url() -> str:
    return settings.JUDGE0_BASE_URL if _is_rapidapi_mode() else FREE_CE_URL

def _get_headers() -> Dict[str, str]:
    if _is_rapidapi_mode():
        return {
            "X-RapidAPI-Key": settings.JUDGE0_API_KEY,
            "X-RapidAPI-Host": settings.JUDGE0_HOST,
            "Content-Type": "application/json",
        }
    return {"Content-Type": "application/json"}


LANGUAGE_IDS: Dict[str, int] = {
    "python": 71,
    "javascript": 63,
    "java": 62,
    "cpp": 54,
    "c": 50,
    "typescript": 74,
    "go": 60,
    "rust": 73,
}

# Status IDs from Judge0 docs
ACCEPTED_STATUS_ID = 3


def _encode(text: str) -> str:
    return base64.b64encode(text.encode()).decode()


def _decode(text: Optional[str]) -> Optional[str]:
    if text is None:
        return None
    try:
        return base64.b64decode(text).decode("utf-8", errors="replace")
    except Exception:
        return text


async def _submit_and_wait(language_id: int, source_code: str, stdin: str = "") -> Dict[str, Any]:
    """
    Submit code and get the result in one step using ?wait=true.
    Falls back to submit+poll if wait mode isn't supported.
    """
    base_url = _get_base_url()
    headers = _get_headers()

    payload = {
        "language_id": language_id,
        "source_code": _encode(source_code),
        "stdin": _encode(stdin),
        "base64_encoded": True,
    }

    async with httpx.AsyncClient(timeout=60) as client:
        # Try synchronous mode first (?wait=true) — returns result directly
        resp = await client.post(
            f"{base_url}/submissions",
            json=payload,
            headers=headers,
            params={"base64_encoded": "true", "wait": "true"},
        )
        resp.raise_for_status()
        data = resp.json()

        # If we got a token instead of a result, fall back to polling
        if "token" in data and "status" not in data:
            return await _poll(data["token"], base_url, headers)

        return data


async def _poll(token: str, base_url: str, headers: Dict[str, str], max_wait: int = 20) -> Dict[str, Any]:
    """Poll until the submission is done (non-queued/processing state)."""
    async with httpx.AsyncClient(timeout=30) as client:
        for _ in range(max_wait):
            resp = await client.get(
                f"{base_url}/submissions/{token}",
                headers=headers,
                params={"base64_encoded": "true"},
            )
            resp.raise_for_status()
            data = resp.json()
            status_id = data.get("status", {}).get("id", 0)
            if status_id not in (1, 2):  # 1=In Queue, 2=Processing
                return data
            await asyncio.sleep(1)
    return {}  # timeout


def _parse_result(data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "status": data.get("status", {}).get("description", "Unknown"),
        "status_id": data.get("status", {}).get("id"),
        "stdout": _decode(data.get("stdout")),
        "stderr": _decode(data.get("stderr")),
        "compile_output": _decode(data.get("compile_output")),
        "time": float(data["time"]) if data.get("time") else None,
        "memory": float(data["memory"]) if data.get("memory") else None,
    }


async def run_code(
    language: str,
    source_code: str,
    stdin: str = "",
) -> Dict[str, Any]:
    """Run code once (no test-case checking). Returns parsed result dict."""
    language_id = LANGUAGE_IDS.get(language.lower())
    if language_id is None:
        raise ValueError(f"Unsupported language: {language}")

    raw = await _submit_and_wait(language_id, source_code, stdin)
    return _parse_result(raw)


async def run_test_cases(
    language: str,
    source_code: str,
    test_cases: List[Dict],
) -> Dict[str, Any]:
    """
    Run *source_code* against each test case in *test_cases*.
    Each test case should have "input" and "expected_output" keys.
    Returns the last execution result plus passed/total counts.
    """
    language_id = LANGUAGE_IDS.get(language.lower())
    if language_id is None:
        raise ValueError(f"Unsupported language: {language}")

    if not test_cases:
        # No test cases — just run once with empty stdin
        result = await run_code(language, source_code)
        result["passed_cases"] = 0
        result["total_cases"] = 0
        return result

    passed = 0
    last_result: Dict[str, Any] = {}
    for tc in test_cases:
        raw = await _submit_and_wait(language_id, source_code, str(tc.get("input", "")))
        result = _parse_result(raw)
        expected = str(tc.get("expected_output", "")).strip()
        actual = (result.get("stdout") or "").strip()
        if result.get("status_id") == ACCEPTED_STATUS_ID and actual == expected:
            passed += 1
        last_result = result

    last_result["passed_cases"] = passed
    last_result["total_cases"] = len(test_cases)
    return last_result
