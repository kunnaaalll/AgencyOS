"""
AgencyOS V2 — Backup Router
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_active_user
from core.database import get_db
from core.exceptions import ForbiddenException
from domain.user.models import User

from .schemas import BackupRecordCreate, BackupRecordResponse
from .services import BackupService

# Since the spec requested GET /api/v1/backups and POST /api/v1/backups,
# but also GET /api/v1/monitoring/backups. We'll map them appropriately.
# Let's map this domain to "/monitoring/backups" OR just "/backups".
# Spec explicitly states:
# Monitoring: GET /api/v1/monitoring/backups
# Backup: GET /api/v1/backups, POST /api/v1/backups
# We'll use prefix="/backups" and later alias the monitoring one.
router = APIRouter(prefix="/backups", tags=["Backups"])


def require_super_admin(current_user: User = Depends(get_current_active_user)):
    if current_user.role is None or current_user.role.name != "Super Admin":
        raise ForbiddenException("Super Admin access required")
    return current_user


@router.get("", response_model=list[BackupRecordResponse])
async def list_backups(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_super_admin),
):
    service = BackupService(db)
    return await service.list_backups(limit=limit, offset=offset)


@router.post("", response_model=BackupRecordResponse)
async def create_backup(
    data: BackupRecordCreate, db: AsyncSession = Depends(get_db), _=Depends(require_super_admin)
):
    service = BackupService(db)
    return await service.create_backup(data)
