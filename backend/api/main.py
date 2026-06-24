"""
AgencyOS V2.1 — FastAPI Application Factory
Production-hardened with rate limiting, security headers, metrics, and tightened CORS.
"""

import uuid
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.exceptions import HTTPException as StarletteHTTPException

from api.router import api_router
from core.audit import register_audit_listeners, set_audit_context
from core.config import settings
from core.exceptions import (
    AgencyOSException,
    agencyos_exception_handler,
    generic_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)
from core.logging import configure_logging
from core.minio import ensure_bucket_exists
from events.listeners import register_listeners

logger = structlog.get_logger(__name__)

# ── Rate Limiter ──────────────────────────────────────────────
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"],
    storage_uri=settings.REDIS_URL if not settings.is_development else None,
)


from arq import create_pool
from arq.connections import RedisSettings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown lifecycle."""
    configure_logging()
    logger.info(
        "Starting AgencyOS Backend",
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
    )

    register_listeners()
    register_audit_listeners()

    # Initialize Redis connection pool for arq jobs
    try:
        app.state.redis = await create_pool(
            RedisSettings(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                password=settings.REDIS_PASSWORD or None,
                database=0,
            )
        )
        logger.info("Redis connection pool initialized")
    except Exception as e:
        logger.warning("Failed to initialize Redis connection pool", error=str(e))
        app.state.redis = None

    # Ensure MinIO bucket exists on startup
    try:
        await ensure_bucket_exists()
        logger.info("MinIO bucket ready", bucket=settings.MINIO_BUCKET_NAME)
    except Exception as e:
        logger.warning("MinIO bucket check failed", error=str(e))

    yield

    logger.info("Shutting down AgencyOS Backend")
    if getattr(app.state, "redis", None):
        await app.state.redis.close()


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""

    # Disable docs in production
    docs_url = "/docs" if not settings.is_production else None
    redoc_url = "/redoc" if not settings.is_production else None
    openapi_url = "/openapi.json" if not settings.is_production else None

    app = FastAPI(
        title="AgencyOS V2 API",
        description="Core Platform API for AgencyOS — the agency operations platform.",
        version=settings.APP_VERSION,
        docs_url=docs_url,
        redoc_url=redoc_url,
        openapi_url=openapi_url,

        lifespan=lifespan,
    )

    # ── Rate Limiting ────────────────────────────────────────
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    from slowapi.middleware import SlowAPIMiddleware

    app.add_middleware(SlowAPIMiddleware)

    # ── CORS ───────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=600,
    )

    # ── Security Headers Middleware ───────────────────────────
    @app.middleware("http")
    async def security_headers_middleware(request: Request, call_next) -> Response:
        response = await call_next(request)

        # Security headers (defense-in-depth — Traefik also sets these)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

        if settings.is_production:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; frame-ancestors 'none'"
            )

        return response

    # ── Request ID + Audit Context Middleware ─────────────────
    @app.middleware("http")
    async def request_context_middleware(request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        structlog.contextvars.bind_contextvars(request_id=request_id)

        # Set audit context for request-scoped tracking
        client_ip = None
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        elif request.client:
            client_ip = request.client.host

        set_audit_context(
            ip_address=client_ip,
            user_agent=request.headers.get("User-Agent"),
        )

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        structlog.contextvars.clear_contextvars()
        return response

    # ── Exception Handlers ────────────────────────────────────
    app.add_exception_handler(AgencyOSException, agencyos_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

    # ── Routers ───────────────────────────────────────────────
    from api.health import router as health_router

    app.include_router(health_router, prefix="/api")
    app.include_router(api_router)

    # ── Prometheus Metrics ────────────────────────────────────
    # Instrumentator(
    #     should_group_status_codes=True,
    #     should_ignore_untemplated=True,
    #     excluded_handlers=["/metrics", "/api/health"],
    # ).instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)

    # ── Root Redirect ─────────────────────────────────────────
    @app.get("/", include_in_schema=False)
    async def root():
        return {"message": "AgencyOS V2 API", "docs": "/docs", "health": "/api/health"}

    return app


app = create_app()
