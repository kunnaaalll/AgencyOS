"""
AgencyOS V2 — User Model
"""

import uuid

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class User(Base):
    """
    Platform user. Belongs to an Organization and has a Role.
    """

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # ── Foreign Keys ──────────────────────────────────────────
    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("organizations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    role_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("roles.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # ── Relationships ─────────────────────────────────────────
    organization: Mapped["Organization | None"] = relationship(  # noqa: F821
        "Organization",
        back_populates="users",
        lazy="select",
    )
    role: Mapped["Role | None"] = relationship(  # noqa: F821
        "Role",
        back_populates="users",
        lazy="select",
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def has_permission(self, permission: str) -> bool:
        """Delegate permission check to the user's role."""
        if self.role is None:
            return False
        return self.role.has_permission(permission)

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"
