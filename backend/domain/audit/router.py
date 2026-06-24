"""
AgencyOS V2 — Audit Log Router
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_active_user
from core.database import get_db
from core.exceptions import ForbiddenException
from domain.user.models import User

from .schemas import AuditLogResponse
from .services import AuditLogService

router = APIRouter(prefix="/monitoring/audit", tags=["Audit"])

def require_super_admin(current_user: User = Depends(get_current_active_user)):
    if current_user.role is None or current_user.role.name != "Super Admin":
        raise ForbiddenException("Super Admin access required")
    return current_user

@router.get("", response_model=list[AuditLogResponse])
async def list_audit_logs(
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_super_admin)
):
    service = AuditLogService(db)
    return await service.list_logs(limit=limit, offset=offset)
