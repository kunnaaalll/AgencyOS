"""
AgencyOS V2 — Organization Model
"""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class Organization(Base):
    """
    Represents an agency organization.
    All users and resources belong to an organization (multi-tenancy).
    """

    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)

    # ── Relationships ─────────────────────────────────────────
    users: Mapped[list["User"]] = relationship(  # noqa: F821
        "User",
        back_populates="organization",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Organization id={self.id} slug={self.slug!r}>"
