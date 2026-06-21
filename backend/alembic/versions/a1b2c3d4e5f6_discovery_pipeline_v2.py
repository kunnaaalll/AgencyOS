"""discovery pipeline v2 - extended schema

Revision ID: a1b2c3d4e5f6
Revises: 9af9cc29fe4e
Create Date: 2026-06-21 08:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "9af9cc29fe4e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Extend raw_businesses ─────────────────────────────────────
    op.add_column("raw_businesses", sa.Column("run_id", sa.Uuid(), nullable=True))
    op.add_column("raw_businesses", sa.Column("rating", sa.Float(), nullable=True))
    op.add_column("raw_businesses", sa.Column("review_count", sa.Integer(), nullable=True))
    op.add_column(
        "raw_businesses",
        sa.Column("completeness_score", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "raw_businesses",
        sa.Column("enriched_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column("raw_businesses", sa.Column("google_rating", sa.Float(), nullable=True))
    op.add_column(
        "raw_businesses",
        sa.Column(
            "opening_hours",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="{}",
            nullable=False,
        ),
    )
    op.add_column("raw_businesses", sa.Column("instagram_url", sa.String(500), nullable=True))
    op.add_column("raw_businesses", sa.Column("facebook_url", sa.String(500), nullable=True))
    op.add_column("raw_businesses", sa.Column("linkedin_url", sa.String(500), nullable=True))
    op.add_column("raw_businesses", sa.Column("youtube_url", sa.String(500), nullable=True))
    op.add_column("raw_businesses", sa.Column("meta_title", sa.String(500), nullable=True))
    op.add_column("raw_businesses", sa.Column("meta_description", sa.Text(), nullable=True))
    op.add_column(
        "raw_businesses",
        sa.Column("is_duplicate", sa.Boolean(), nullable=False, server_default="false"),
    )

    # Create indices for deduplication lookups
    op.create_index("ix_raw_businesses_website", "raw_businesses", ["website"])
    op.create_index("ix_raw_businesses_phone", "raw_businesses", ["phone"])
    op.create_index("ix_raw_businesses_google_maps_url", "raw_businesses", ["google_maps_url"])
    op.create_index(
        "ix_raw_businesses_validation_status", "raw_businesses", ["validation_status"]
    )
    op.create_index("ix_raw_businesses_industry", "raw_businesses", ["industry"])
    op.create_index("ix_raw_businesses_city", "raw_businesses", ["city"])

    # ── Create discovery_bulk_jobs ────────────────────────────────
    op.create_table(
        "discovery_bulk_jobs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "industries",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
        sa.Column(
            "locations",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
        sa.Column(
            "sources",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
        sa.Column("limit_per_query", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("status", sa.String(50), nullable=False, server_default="PENDING"),
        sa.Column("total_queries", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completed_queries", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("failed_queries", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("businesses_discovered", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_message", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_discovery_bulk_jobs_id"), "discovery_bulk_jobs", ["id"], unique=False
    )
    op.create_index(
        "ix_discovery_bulk_jobs_status", "discovery_bulk_jobs", ["status"]
    )


def downgrade() -> None:
    op.drop_index("ix_discovery_bulk_jobs_status", table_name="discovery_bulk_jobs")
    op.drop_index(op.f("ix_discovery_bulk_jobs_id"), table_name="discovery_bulk_jobs")
    op.drop_table("discovery_bulk_jobs")

    op.drop_index("ix_raw_businesses_city", table_name="raw_businesses")
    op.drop_index("ix_raw_businesses_industry", table_name="raw_businesses")
    op.drop_index("ix_raw_businesses_validation_status", table_name="raw_businesses")
    op.drop_index("ix_raw_businesses_google_maps_url", table_name="raw_businesses")
    op.drop_index("ix_raw_businesses_phone", table_name="raw_businesses")
    op.drop_index("ix_raw_businesses_website", table_name="raw_businesses")

    for col in [
        "run_id", "rating", "review_count", "completeness_score", "enriched_at",
        "google_rating", "opening_hours", "instagram_url", "facebook_url",
        "linkedin_url", "youtube_url", "meta_title", "meta_description", "is_duplicate",
    ]:
        op.drop_column("raw_businesses", col)
