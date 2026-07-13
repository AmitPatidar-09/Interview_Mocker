import json
import re
from typing import Any


def extract_json_from_response(text: str) -> Any:
    """
    Robustly extract JSON from an AI response that may contain
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

    # Fix #10: Find the first {...} block using NON-GREEDY match
    brace_match = re.search(r"\{[\s\S]*?\}", text)
    if brace_match:
        try:
            return json.loads(brace_match.group())
        except json.JSONDecodeError:
            # Non-greedy might be too short; try balanced brace extraction
            pass

    # Fallback: find the outermost balanced braces manually
    result = _extract_balanced_json(text)
    if result is not None:
        return result

    raise ValueError(f"Could not extract JSON from response: {text[:200]}")


def _extract_balanced_json(text: str) -> Any:
    """Extract JSON by finding balanced braces from the first '{' in text."""
    start = text.find("{")
    if start == -1:
        return None
    depth = 0
    in_string = False
    escape = False
    for i in range(start, len(text)):
        ch = text[i]
        if escape:
            escape = False
            continue
        if ch == "\\":
            escape = True
            continue
        if ch == '"' and not escape:
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(text[start:i + 1])
                except json.JSONDecodeError:
                    return None
    return None


def sanitize_string(s: str) -> str:
    """Strip excessive whitespace from a string."""
    return " ".join(s.split())


def sanitize_for_prompt(text: str, max_length: int = 2000) -> str:
    """Fix #14: Sanitize user input before embedding in AI prompts.
    
    Strips common prompt injection patterns and truncates to max_length.
    """
    # Truncate first
    text = text[:max_length]
    # Remove common prompt injection delimiters
    text = re.sub(r"(?i)(ignore|disregard|forget)\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|context)", "[FILTERED]", text)
    return text
