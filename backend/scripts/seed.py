"""
AgencyOS V2 — Database Seed Script
===========================================
Creates:
  1. Organization: AgencyOS (from env)
  2. Five initial roles with appropriate permissions
  3. Super Admin user (credentials from env)

This script is IDEMPOTENT — safe to run multiple times.
Credentials are NEVER hardcoded — all from environment variables.

Usage:
  python -m scripts.seed
  make seed
"""

import asyncio
import sys
from pathlib import Path

# Add backend root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import AsyncSessionFactory
from core.logging import configure_logging
from core.security import hash_password
from domain.organization.models import Organization
from domain.role.models import Role
from domain.user.models import User
from utils.slugify import slugify

logger = structlog.get_logger(__name__)

# ── Role Definitions ──────────────────────────────────────────
ROLES: list[dict] = [
    {
        "name": "Super Admin",
        "permissions": ["*"],
        "description": "Full platform access",
    },
    {
        "name": "Sales Founder",
        "permissions": [
            "pipeline:read",
            "pipeline:write",
            "opportunities:read",
            "opportunities:write",
            "opportunities:delete",
            "contacts:read",
            "reports:read",
        ],
        "description": "Pipeline and opportunity management",
    },
    {
        "name": "Operations Founder",
        "permissions": [
            "clients:read",
            "clients:write",
            "projects:read",
            "projects:write",
            "delivery:read",
            "delivery:write",
            "reports:read",
        ],
        "description": "Client delivery operations",
    },
    {
        "name": "Marketing Founder",
        "permissions": [
            "campaigns:read",
            "campaigns:write",
            "campaigns:delete",
            "reports:read",
            "analytics:read",
        ],
        "description": "Campaign and reporting",
    },
    {
        "name": "Finance Founder",
        "permissions": [
            "finance:read",
            "finance:write",
            "invoices:read",
            "invoices:write",
            "invoices:delete",
            "profitability:read",
            "reports:read",
        ],
        "description": "Finance and profitability",
    },
]


async def seed(db: AsyncSession) -> None:
    logger.info("Starting database seed...")

    # ── 1. Organization ───────────────────────────────────────
    org_name = settings.SEED_ORGANIZATION_NAME
    org_slug = slugify(org_name)

    result = await db.execute(select(Organization).where(Organization.slug == org_slug))
    org = result.scalar_one_or_none()

    if org:
        logger.info("Organization already exists", name=org.name, slug=org.slug)
    else:
        org = Organization(name=org_name, slug=org_slug)
        db.add(org)
        await db.flush()
        logger.info("Created organization", name=org.name, slug=org.slug)

    # ── 2. Roles ──────────────────────────────────────────────
    role_map: dict[str, Role] = {}

    for role_def in ROLES:
        result = await db.execute(select(Role).where(Role.name == role_def["name"]))
        role = result.scalar_one_or_none()

        if role:
            logger.info("Role already exists", name=role.name)
        else:
            role = Role(name=role_def["name"], permissions=role_def["permissions"])
            db.add(role)
            await db.flush()
            logger.info("Created role", name=role.name, permissions=role.permissions)

        role_map[role.name] = role

    # ── 3. Super Admin User ───────────────────────────────────
    admin_email = settings.SEED_SUPERADMIN_EMAIL.lower().strip()
    result = await db.execute(select(User).where(User.email == admin_email))
    admin = result.scalar_one_or_none()

    super_admin_role = role_map.get("Super Admin")

    if admin:
        logger.info("Super admin already exists", email=admin.email)
    else:
        admin = User(
            email=admin_email,
            hashed_password=hash_password(settings.SEED_SUPERADMIN_PASSWORD),
            first_name=settings.SEED_SUPERADMIN_FIRST_NAME,
            last_name=settings.SEED_SUPERADMIN_LAST_NAME,
            is_active=True,
            organization_id=org.id,
            role_id=super_admin_role.id if super_admin_role else None,
        )
        db.add(admin)
        await db.flush()
        logger.info(
            "Created super admin user",
            email=admin.email,
            organization=org.name,
            role="Super Admin",
        )

    await db.commit()
    logger.info("✅ Database seed completed successfully")
    logger.info(
        "Login credentials",
        email=settings.SEED_SUPERADMIN_EMAIL,
        note="Password is set from SEED_SUPERADMIN_PASSWORD env var",
    )


async def main() -> None:
    configure_logging()
    async with AsyncSessionFactory() as db:
        await seed(db)


if __name__ == "__main__":
    asyncio.run(main())
