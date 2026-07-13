"""
InterviewAce AI — FastAPI application entry point.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import create_tables
from app.routes import auth, interview, coding, analytics

# ──────────────────── Logging ────────────────────
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ──────────────────── Rate Limiter (Fix #5) ────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

# ──────────────────── Lifespan ────────────────────

@asynccontextmanager
async def lifespan(app):
    create_tables()
    logger.info("Database tables created/verified.")
    yield

# ──────────────────── App ────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered technical interview practice platform.",
    docs_url="/docs" if settings.DEBUG else None,    # Hide docs in production
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ──────────────────── CORS ────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────── Routers ────────────────────

app.include_router(auth.router, prefix="/api/v1")
app.include_router(interview.router, prefix="/api/v1")
app.include_router(coding.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")


# ──────────────────── Health ────────────────────

@app.get("/", tags=["health"])
async def root():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


@app.get("/health", tags=["health"])
async def health():
    return {"status": "healthy"}
