import json
import re
from typing import Any


def extract_json_from_response(text: str) -> Any:
    """
    Robustly extract JSON from a Gemini response that may contain
    markdown code fences or extra prose.
    """
    # Try direct parse first
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Strip ```json ... ``` or ``` ... ```
    pattern = r"```(?:json)?\s*([\s\S]*?)```"
    matches = re.findall(pattern, text)
    if matches:
        try:
            return json.loads(matches[0].strip())
        except json.JSONDecodeError:
            pass

    # Find the first {...} block
    brace_match = re.search(r"\{[\s\S]*\}", text)
    if brace_match:
        try:
            return json.loads(brace_match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not extract JSON from response: {text[:200]}")


def sanitize_string(s: str) -> str:
    """Strip excessive whitespace from a string."""
    return " ".join(s.split())
