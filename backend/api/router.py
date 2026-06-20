"""
AgencyOS V2 — Root API Router
Aggregates all domain routers under /api prefix.
"""

from fastapi import APIRouter

from api.health import router as health_router
from domain.auth.router import router as auth_router
from domain.organization.router import router as org_router
from domain.role.router import router as role_router
from domain.user.router import router as user_router
from domain.lead.router import router as lead_router
from domain.discovery.router import router as discovery_router
from domain.crm.router import router as crm_router

api_router = APIRouter(prefix="/api")

# ── Health (no auth required) ─────────────────────────────────
api_router.include_router(health_router)

# ── Authentication ────────────────────────────────────────────
api_router.include_router(auth_router)

# ── Protected Domain Routers ──────────────────────────────────
api_router.include_router(user_router)
api_router.include_router(org_router)
api_router.include_router(role_router)
api_router.include_router(lead_router)
api_router.include_router(discovery_router)
api_router.include_router(crm_router)
