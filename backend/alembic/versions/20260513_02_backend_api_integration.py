"""add user/org settings fields and query indexes

Revision ID: 20260513_02
Revises: 20260512_01
Create Date: 2026-05-13 00:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "20260513_02"
down_revision: str | None = "20260512_01"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "organizations",
        sa.Column(
            "settings",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
    )
    op.add_column("users", sa.Column("avatar_url", sa.String(length=512), nullable=True))
    op.add_column(
        "users",
        sa.Column(
            "preferences",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
    )

    op.create_index("ix_users_organization_email", "users", ["organization_id", "email"], unique=False)
    op.create_index("ix_audit_logs_event_type", "audit_logs", ["event_type"], unique=False)
    op.create_index("ix_threat_events_threat_type", "threat_events", ["threat_type"], unique=False)
    op.create_index("ix_governance_decisions_created_at", "governance_decisions", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_governance_decisions_created_at", table_name="governance_decisions")
    op.drop_index("ix_threat_events_threat_type", table_name="threat_events")
    op.drop_index("ix_audit_logs_event_type", table_name="audit_logs")
    op.drop_index("ix_users_organization_email", table_name="users")

    op.drop_column("users", "preferences")
    op.drop_column("users", "avatar_url")
    op.drop_column("organizations", "settings")
