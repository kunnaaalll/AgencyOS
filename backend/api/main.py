"""
AgencyOS V2 — FastAPI Application Factory
"""

import uuid
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from api.router import api_router
from core.config import settings
from core.exceptions import AgencyOSException, agencyos_exception_handler, generic_exception_handler
from core.logging import configure_logging
from core.minio import ensure_bucket_exists
from events.listeners import register_listeners
from core.audit import register_audit_listeners

logger = structlog.get_logger(__name__)


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

    # Ensure MinIO bucket exists on startup
    try:
        await ensure_bucket_exists()
        logger.info("MinIO bucket ready", bucket=settings.MINIO_BUCKET_NAME)
    except Exception as e:
        logger.warning("MinIO bucket check failed", error=str(e))

    yield

    logger.info("Shutting down AgencyOS Backend")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="AgencyOS V2 API",
        description="Core Platform API for AgencyOS — the agency operations platform.",
        version=settings.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        default_response_class=ORJSONResponse,
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Request ID Middleware ─────────────────────────────────
    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        structlog.contextvars.bind_contextvars(request_id=request_id)
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        structlog.contextvars.clear_contextvars()
        return response

    # ── Exception Handlers ────────────────────────────────────
    app.add_exception_handler(AgencyOSException, agencyos_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

    # ── Routers ───────────────────────────────────────────────
    app.include_router(api_router)

    # ── Root Redirect ─────────────────────────────────────────
    @app.get("/", include_in_schema=False)
    async def root():
        return {"message": "AgencyOS V2 API", "docs": "/docs", "health": "/api/health"}

    return app


app = create_app()
