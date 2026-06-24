"""
AgencyOS V2.1 — Audit Log Event Listeners
Automatically intercepts CREATE, UPDATE, DELETE actions on SQLAlchemy models.
Enhanced with explicit security audit functions for LOGIN, LOGOUT, PASSWORD_CHANGE, PERMISSION_CHANGE.
"""

import enum
from contextvars import ContextVar
from typing import Any

import structlog
from sqlalchemy import event
from sqlalchemy.engine import Connection
from sqlalchemy.inspection import inspect
from sqlalchemy.orm import Mapper, object_session

from core.database import Base
from domain.audit.models import AuditLog

logger = structlog.get_logger(__name__)

# ── Context Variables for Request-scoped Data ─────────────────
audit_user_id: ContextVar[str | None] = ContextVar("audit_user_id", default=None)
audit_ip_address: ContextVar[str | None] = ContextVar("audit_ip_address", default=None)
audit_user_agent: ContextVar[str | None] = ContextVar("audit_user_agent", default=None)


class AuditAction(str, enum.Enum):
    """Typed audit actions for consistent logging."""

    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    LOGIN_FAILED = "LOGIN_FAILED"
    PASSWORD_CHANGE = "PASSWORD_CHANGE"
    PERMISSION_CHANGE = "PERMISSION_CHANGE"
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED"
    ACCOUNT_UNLOCKED = "ACCOUNT_UNLOCKED"
    TOKEN_REVOKED = "TOKEN_REVOKED"


def set_audit_context(
    user_id: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> None:
    """Set request-scoped audit context."""
    if user_id is not None:
        audit_user_id.set(user_id)
    if ip_address is not None:
        audit_ip_address.set(ip_address)
    if user_agent is not None:
        audit_user_agent.set(user_agent)


def get_state_dict(obj: Any, state: Any = None) -> dict[str, str]:
    if state is None:
        result = {}
        for c in obj.__table__.columns:
            val = getattr(obj, c.key, None)
            result[c.key] = str(val) if val is not None else None
        return result
    else:
        result = {}
        for c in obj.__table__.columns:
            val = state.attrs[c.key].value
            result[c.key] = str(val) if val is not None else None
        return result


def after_insert_listener(mapper: Mapper, connection: Connection, target: Base) -> None:
    if isinstance(target, AuditLog):
        return

    new_values = get_state_dict(target)

    connection.execute(
        AuditLog.__table__.insert().values(
            entity_type=target.__class__.__name__,
            entity_id=str(getattr(target, "id", "")),
            action=AuditAction.CREATE.value,
            user_id=audit_user_id.get(),
            ip_address=audit_ip_address.get(),
            user_agent=audit_user_agent.get(),
            old_values=None,
            new_values=new_values,
        )
    )


def after_update_listener(mapper: Mapper, connection: Connection, target: Base) -> None:
    if isinstance(target, AuditLog):
        return

    session = object_session(target)
    if not session:
        return

    state = inspect(target)
    old_values: dict[str, Any] = {}
    new_values: dict[str, Any] = {}

    for attr in state.attrs:
        history = attr.history
        if history.has_changes():
            old_values[attr.key] = str(history.deleted[0]) if history.deleted else None
            new_values[attr.key] = str(history.added[0]) if history.added else None

    if not old_values and not new_values:
        return

    connection.execute(
        AuditLog.__table__.insert().values(
            entity_type=target.__class__.__name__,
            entity_id=str(getattr(target, "id", "")),
            action=AuditAction.UPDATE.value,
            user_id=audit_user_id.get(),
            ip_address=audit_ip_address.get(),
            user_agent=audit_user_agent.get(),
            old_values=old_values,
            new_values=new_values,
        )
    )


def after_delete_listener(mapper: Mapper, connection: Connection, target: Base) -> None:
    if isinstance(target, AuditLog):
        return

    old_values = get_state_dict(target)

    connection.execute(
        AuditLog.__table__.insert().values(
            entity_type=target.__class__.__name__,
            entity_id=str(getattr(target, "id", "")),
            action=AuditAction.DELETE.value,
            user_id=audit_user_id.get(),
            ip_address=audit_ip_address.get(),
            user_agent=audit_user_agent.get(),
            old_values=old_values,
            new_values=None,
        )
    )


def register_audit_listeners() -> None:
    event.listen(Base, "after_insert", after_insert_listener, propagate=True)
    event.listen(Base, "after_update", after_update_listener, propagate=True)
    event.listen(Base, "after_delete", after_delete_listener, propagate=True)


# ── Explicit Security Audit Functions ─────────────────────────
# These write audit events directly (not via SQLAlchemy listeners)
# for security-critical actions like login/logout.


async def audit_security_event(
    db_session: Any,
    action: AuditAction,
    entity_type: str = "User",
    entity_id: str = "",
    details: dict[str, Any] | None = None,
    user_id: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> None:
    """Record a security audit event directly in the audit log."""
    from domain.audit.models import AuditLog

    _user_id = user_id or audit_user_id.get()
    _ip = ip_address or audit_ip_address.get()
    _ua = user_agent or audit_user_agent.get()

    if _user_id == "":
        _user_id = None

    await db_session.execute(
        AuditLog.__table__.insert().values(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action.value,
            user_id=_user_id,
            ip_address=_ip,
            user_agent=_ua,
            old_values=None,
            new_values=details,
        )
    )

    logger.info(
        "Security audit event",
        action=action.value,
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=_user_id,
        ip_address=_ip,
    )


async def audit_login(
    db_session: Any, user_id: str, email: str, ip: str | None = None, ua: str | None = None
) -> None:
    await audit_security_event(
        db_session, AuditAction.LOGIN, "User", user_id, {"email": email}, user_id, ip, ua
    )


async def audit_login_failed(
    db_session: Any, email: str, ip: str | None = None, ua: str | None = None
) -> None:
    await audit_security_event(
        db_session, AuditAction.LOGIN_FAILED, "User", "", {"email": email}, None, ip, ua
    )


async def audit_logout(db_session: Any, user_id: str, ip: str | None = None) -> None:
    await audit_security_event(
        db_session, AuditAction.LOGOUT, "User", user_id, user_id=user_id, ip_address=ip
    )


async def audit_password_change(db_session: Any, user_id: str, ip: str | None = None) -> None:
    await audit_security_event(
        db_session, AuditAction.PASSWORD_CHANGE, "User", user_id, user_id=user_id, ip_address=ip
    )


async def audit_account_locked(db_session: Any, email: str, ip: str | None = None) -> None:
    await audit_security_event(
        db_session, AuditAction.ACCOUNT_LOCKED, "User", "", {"email": email}, ip_address=ip
    )
