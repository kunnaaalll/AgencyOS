"""
AgencyOS V2 — Automation OS Router
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_active_user
from core.database import get_db
from core.exceptions import ForbiddenException
from domain.user.models import User

from .schemas import WorkflowExecutionResponse
from .services import WorkflowExecutionService

router = APIRouter(prefix="/monitoring/workflows", tags=["Automation"])


def require_super_admin(current_user: User = Depends(get_current_active_user)):
    if current_user.role is None or current_user.role.name != "Super Admin":
        raise ForbiddenException("Super Admin access required")
    return current_user


@router.get("", response_model=list[WorkflowExecutionResponse])
async def list_workflows(
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_super_admin),
):
    service = WorkflowExecutionService(db)
    return await service.list_executions(limit=limit, offset=offset)
