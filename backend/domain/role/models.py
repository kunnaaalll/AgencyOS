"""
AgencyOS V2 — Role Model
RBAC role with extensible JSON permissions array.
"""

from typing import Any

from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class Role(Base):
    """
    Represents an access control role.
    Permissions are stored as a JSON array of permission strings.

    Example permissions:
      - "*"                  → Super Admin: all access
      - "pipeline:read"      → Sales: read pipeline
      - "pipeline:write"     → Sales: write pipeline
      - "clients:*"          → Ops: all client operations
    """

    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    permissions: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
        doc="Array of permission strings. Use '*' for full access.",
    )

    # ── Relationships ─────────────────────────────────────────
    users: Mapped[list["User"]] = relationship(  # noqa: F821
        "User",
        back_populates="role",
        lazy="select",
    )

    def has_permission(self, permission: str) -> bool:
        """
        Check if this role grants the given permission.
        '*' grants all permissions.
        'resource:*' grants all sub-permissions for that resource.
        """
        if "*" in self.permissions:
            return True
        if permission in self.permissions:
            return True
        # Check wildcard for resource prefix
        resource = permission.split(":")[0]
        return f"{resource}:*" in self.permissions

    def __repr__(self) -> str:
        return f"<Role id={self.id} name={self.name!r}>"
