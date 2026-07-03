from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "InterviewAce AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "change-this-to-a-very-long-random-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = "sqlite:///./interviewace.db"

    # ── AI Provider ──────────────────────────────────────────────────
    # Set primary provider: ollama | groq | gemini
    # Ollama is default (free, local, open-source)
    AI_PROVIDER: str = "ollama"
    # Optional fallback if primary fails: ollama | groq | gemini | none
    AI_FALLBACK_PROVIDER: str = "gemini"

    # Ollama (local open-source, completely free)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1:8b"          # or mistral, phi3, gemma2, etc.

    # Groq (cloud, open-weight models, generous free tier)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama3-8b-8192"          # fast & efficient; or mixtral-8x7b-32768

    # Gemini (optional, closed-source fallback)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # Judge0
    JUDGE0_API_KEY: str = ""
    JUDGE0_BASE_URL: str = "https://judge0-ce.p.rapidapi.com"
    JUDGE0_HOST: str = "judge0-ce.p.rapidapi.com"

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
# Force uvicorn to reload to pick up the new .env values
