"""
Gemini AI service — thin wrapper around the Google GenAI SDK.
All prompt construction is done in prompts/templates.py.
"""

import google.generativeai as genai
from ..config import settings
from ..utils.helpers import extract_json_from_response

genai.configure(api_key=settings.GEMINI_API_KEY)

_model = genai.GenerativeModel(settings.GEMINI_MODEL)


from sqlalchemy.orm import Session
from ..models.token_log import TokenUsageLog

async def generate_json(prompt: str, db: Session = None, user_id: int = None, endpoint: str = "unknown") -> dict:
    """
    Send *prompt* to Gemini and return the parsed JSON response.
    Logs token usage if db is provided.
    Raises ValueError if JSON cannot be extracted.
    """
    response = await _model.generate_content_async(prompt)
    
    if db is not None:
        usage = response.usage_metadata
        if usage:
            log = TokenUsageLog(
                user_id=user_id,
                endpoint=endpoint,
                model=settings.GEMINI_MODEL,
                prompt_tokens=usage.prompt_token_count,
                completion_tokens=usage.candidates_token_count,
                total_tokens=usage.total_token_count
            )
            db.add(log)
            db.commit()

    text = response.text
    return extract_json_from_response(text)
