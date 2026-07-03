"""
Unified AI service — pluggable provider system.

Priority order is configured via .env:
  AI_PROVIDER         = ollama | groq | gemini   (primary)
  AI_FALLBACK_PROVIDER= ollama | groq | gemini | none  (fallback)

Providers:
  - Ollama  — local, completely free, open-source (default)
  - Groq    — cloud, open-weight models, generous free tier
  - Gemini  — Google, closed-source, highest quality fallback

All providers implement the same interface:
    async generate_json(prompt: str) -> dict
"""

import httpx
from abc import ABC, abstractmethod
from typing import Any, Optional

from ..config import settings
from ..utils.helpers import extract_json_from_response


# ──────────────────── Base ────────────────────

class AIProvider(ABC):
    name: str = "base"

    @abstractmethod
    async def generate_json(self, prompt: str) -> dict:
        ...


# ──────────────────── Ollama ────────────────────

class OllamaProvider(AIProvider):
    name = "ollama"

    async def generate_json(self, prompt: str) -> dict:
        payload = {
            "model": settings.OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "format": "json",
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json=payload,
                timeout=120.0,
            )
            response.raise_for_status()
            data = response.json()
            text = data.get("response", "")
            return extract_json_from_response(text)


# ──────────────────── Groq ────────────────────

class GroqProvider(AIProvider):
    name = "groq"

    async def generate_json(self, prompt: str) -> dict:
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not set")

        # Groq uses OpenAI-compatible API
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": settings.GROQ_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert technical interview assistant. Always respond with valid JSON only — no markdown, no code fences, no extra text.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.4,
            "max_tokens": 1024,
            "response_format": {"type": "json_object"},
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            text = data["choices"][0]["message"]["content"]
            return extract_json_from_response(text)


# ──────────────────── Gemini ────────────────────

class GeminiProvider(AIProvider):
    name = "gemini"

    def __init__(self):
        if settings.GEMINI_API_KEY:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._model = genai.GenerativeModel(settings.GEMINI_MODEL)
        else:
            self._model = None

    async def generate_json(self, prompt: str) -> dict:
        if not self._model:
            raise ValueError("GEMINI_API_KEY is not set")
        response = await self._model.generate_content_async(prompt)
        return extract_json_from_response(response.text)


# ──────────────────── Registry ────────────────────

_PROVIDERS: dict[str, type[AIProvider]] = {
    "ollama": OllamaProvider,
    "groq":   GroqProvider,
    "gemini": GeminiProvider,
}


def _build_provider(name: str) -> Optional[AIProvider]:
    cls = _PROVIDERS.get(name.lower())
    if cls is None:
        return None
    try:
        return cls()
    except Exception as e:
        print(f"[ai_service] Failed to initialise provider '{name}': {e}")
        return None


# Lazy-initialised singletons
_primary: Optional[AIProvider] = None
_fallback: Optional[AIProvider] = None
_initialised = False


def _ensure_initialised():
    global _primary, _fallback, _initialised
    if _initialised:
        return
    _primary = _build_provider(settings.AI_PROVIDER)
    fb_name = settings.AI_FALLBACK_PROVIDER.lower()
    if fb_name and fb_name != "none" and fb_name != settings.AI_PROVIDER.lower():
        _fallback = _build_provider(fb_name)
    _initialised = True
    print(f"[ai_service] Primary: {settings.AI_PROVIDER}  |  Fallback: {settings.AI_FALLBACK_PROVIDER}")


# ──────────────────── Public API ────────────────────

async def generate_json(prompt: str, **kwargs) -> dict:
    """
    Generate a JSON response from the configured AI provider.
    Automatically falls back to the secondary provider on failure.

    Extra kwargs (db, user_id, endpoint) are accepted but ignored
    for API compatibility with the old gemini_service signature.
    """
    _ensure_initialised()

    providers_to_try = [p for p in (_primary, _fallback) if p is not None]
    if not providers_to_try:
        raise RuntimeError(
            "No AI provider is available. Set AI_PROVIDER in .env "
            "(ollama / groq / gemini) and ensure the required API keys are present."
        )

    last_error: Optional[Exception] = None
    for provider in providers_to_try:
        try:
            result = await provider.generate_json(prompt)
            return result
        except Exception as e:
            print(f"[ai_service] Provider '{provider.name}' failed: {e}")
            last_error = e

    raise RuntimeError(
        f"All AI providers failed. Last error: {last_error}"
    )


def get_active_provider_name() -> str:
    """Return the name of the currently configured primary provider."""
    return settings.AI_PROVIDER
