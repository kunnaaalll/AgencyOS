"""
AgencyOS V2 — Audit Log Event Listeners
Automatically intercepts CREATE, UPDATE, DELETE actions on SQLAlchemy models.
"""

from sqlalchemy import event
from sqlalchemy.orm import object_session
from sqlalchemy.engine import Connection
from sqlalchemy.orm import Mapper
from core.database import Base
from domain.audit.models import AuditLog

# Store thread-local context or request-bound user info if needed. 
# For now, we capture changes automatically. 
# In a robust system, we would inject `user_id` from ContextVar.
# We will just capture entity_type, action, old_values, new_values.

def get_state_dict(obj, state=None):
    if state is None:
        return {c.key: getattr(obj, c.key) for c in obj.__table__.columns}
    else:
        return {c.key: state.attrs[c.key].value for c in obj.__table__.columns}

def after_insert_listener(mapper: Mapper, connection: Connection, target: Base):
    if isinstance(target, AuditLog):
        return
    
    new_values = get_state_dict(target)
    # Remove sensitive or non-serializable fields if needed (like datetime to str)
    for k, v in new_values.items():
        if v is not None:
            new_values[k] = str(v)

    connection.execute(
        AuditLog.__table__.insert().values(
            entity_type=target.__class__.__name__,
            entity_id=str(getattr(target, "id", "")),
            action="CREATE",
            old_values=None,
            new_values=new_values
        )
    )

def after_update_listener(mapper: Mapper, connection: Connection, target: Base):
    if isinstance(target, AuditLog):
        return
    
    session = object_session(target)
    if not session:
        return

    # To get old values, we need the history
    state = inspect(target)
    old_values = {}
    new_values = {}
    
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
            action="UPDATE",
            old_values=old_values,
            new_values=new_values
        )
    )

def after_delete_listener(mapper: Mapper, connection: Connection, target: Base):
    if isinstance(target, AuditLog):
        return

    old_values = get_state_dict(target)
    for k, v in old_values.items():
        if v is not None:
            old_values[k] = str(v)

    connection.execute(
        AuditLog.__table__.insert().values(
            entity_type=target.__class__.__name__,
            entity_id=str(getattr(target, "id", "")),
            action="DELETE",
            old_values=old_values,
            new_values=None
        )
    )

def register_audit_listeners():
    from sqlalchemy.inspection import inspect
    # Register listeners on Base
    # Note: Event listening on a base class fires for all mapped subclasses
    event.listen(Base, 'after_insert', after_insert_listener, propagate=True)
    event.listen(Base, 'after_update', after_update_listener, propagate=True)
    event.listen(Base, 'after_delete', after_delete_listener, propagate=True)
    
    # We also need a login/logout capture, which can be done in the auth endpoints directly.
