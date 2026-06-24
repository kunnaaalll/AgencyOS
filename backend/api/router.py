"""
AgencyOS V2 — Root API Router
Aggregates all domain routers under /api prefix.
"""

from fastapi import APIRouter

from api.health import router as health_router
from domain.analysis.router import router as analysis_router
from domain.analytics.router import router as analytics_router
from domain.audit.router import router as audit_router
from domain.auth.router import router as auth_router
from domain.automation.router import router as automation_router
from domain.backup.router import router as backup_router
from domain.client.router import router as client_router
from domain.crm.router import router as crm_router
from domain.discovery.router import router as discovery_router
from domain.documents.router import router as documents_router
from domain.finance.router import router as finance_router
from domain.knowledge.router import router as knowledge_router
from domain.lead.router import router as lead_router
from domain.monitoring.router import router as monitoring_router
from domain.notifications.router import router as notifications_router
from domain.organization.router import router as org_router
from domain.outreach.router import router as outreach_router
from domain.project.router import router as project_router
from domain.qualification_ai.router import router as qualification_router
from domain.role.router import router as role_router
from domain.task.router import router as task_router
from domain.user.router import router as user_router

api_router = APIRouter(prefix="/api/v1")

# ── Health (mounted in main.py for /api/health and here for /api/v1/health)
api_router.include_router(health_router)

# ── Authentication ────────────────────────────────────────────
api_router.include_router(auth_router)

# ── Protected Domain Routers ──────────────────────────────────
api_router.include_router(user_router)
api_router.include_router(org_router)
api_router.include_router(role_router)
api_router.include_router(lead_router)
api_router.include_router(discovery_router)
api_router.include_router(analysis_router)
api_router.include_router(qualification_router)
api_router.include_router(outreach_router)
api_router.include_router(crm_router)
api_router.include_router(client_router)
api_router.include_router(project_router)
api_router.include_router(task_router)
api_router.include_router(finance_router)
api_router.include_router(knowledge_router)
api_router.include_router(documents_router)
api_router.include_router(analytics_router)

# ── System / Automation / Audit / Backups ─────────────────────
api_router.include_router(monitoring_router)
api_router.include_router(automation_router)
api_router.include_router(audit_router)
api_router.include_router(notifications_router)
api_router.include_router(backup_router)
