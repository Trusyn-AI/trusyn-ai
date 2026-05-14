"""initial saas core schema

Revision ID: 20260512_01
Revises: 
Create Date: 2026-05-12 00:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "20260512_01"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


organization_status_enum = postgresql.ENUM(
    "ACTIVE",
    "SUSPENDED",
    "TRIAL",
    "DISABLED",
    name="organization_status_enum",
)

user_role_enum = postgresql.ENUM(
    "SUPER_ADMIN",
    "ORG_ADMIN",
    "ANALYST",
    "DEVELOPER",
    name="user_role_enum",
)

agent_status_enum = postgresql.ENUM(
    "OPERATIONAL",
    "WARNING",
    "QUARANTINED",
    "BLOCKED",
    name="agent_status_enum",
)

threat_severity_enum = postgresql.ENUM(
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
    name="threat_severity_enum",
)

audit_severity_enum = postgresql.ENUM(
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
    name="audit_severity_enum",
)

governance_decision_type_enum = postgresql.ENUM(
    "ALLOW",
    "BLOCK",
    "REVIEW",
    "QUARANTINE",
    "RATE_LIMIT",
    name="governance_decision_type_enum",
)

governance_decision_enum = postgresql.ENUM(
    "ALLOW",
    "BLOCK",
    "REVIEW",
    "QUARANTINE",
    "RATE_LIMIT",
    name="governance_decision_enum",
)


def upgrade() -> None:
    organization_status_enum.create(op.get_bind(), checkfirst=True)
    user_role_enum.create(op.get_bind(), checkfirst=True)
    agent_status_enum.create(op.get_bind(), checkfirst=True)
    threat_severity_enum.create(op.get_bind(), checkfirst=True)
    audit_severity_enum.create(op.get_bind(), checkfirst=True)
    governance_decision_type_enum.create(op.get_bind(), checkfirst=True)
    governance_decision_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "organizations",
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("plan", sa.String(length=100), server_default="starter", nullable=False),
        sa.Column("status", organization_status_enum, server_default="ACTIVE", nullable=False),
        sa.Column("website", sa.String(length=255), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_organizations")),
        sa.UniqueConstraint("slug", name=op.f("uq_organizations_slug")),
    )
    op.create_index("ix_organizations_slug", "organizations", ["slug"], unique=False)
    op.create_index("ix_organizations_status", "organizations", ["status"], unique=False)

    op.create_table(
        "users",
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", user_role_enum, server_default="DEVELOPER", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], name=op.f("fk_users_organization_id_organizations"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
        sa.UniqueConstraint("email", name=op.f("uq_users_email")),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=False)
    op.create_index("ix_users_organization_id", "users", ["organization_id"], unique=False)

    op.create_table(
        "ai_agents",
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", agent_status_enum, server_default="OPERATIONAL", nullable=False),
        sa.Column("trust_score", sa.Integer(), server_default="100", nullable=False),
        sa.Column("permissions", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("last_active_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("trust_score >= 0 AND trust_score <= 100", name="ck_ai_agents_trust_score_range"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], name=op.f("fk_ai_agents_organization_id_organizations"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_ai_agents")),
    )
    op.create_index("ix_ai_agents_organization_id", "ai_agents", ["organization_id"], unique=False)
    op.create_index("ix_ai_agents_status", "ai_agents", ["status"], unique=False)

    op.create_table(
        "policies",
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("rule_definition", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("enforcement_action", governance_decision_type_enum, server_default="REVIEW", nullable=False),
        sa.Column("enabled", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("is_deleted", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], name=op.f("fk_policies_organization_id_organizations"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_policies")),
    )
    op.create_index("ix_policies_enabled", "policies", ["enabled"], unique=False)
    op.create_index("ix_policies_organization_id", "policies", ["organization_id"], unique=False)

    op.create_table(
        "api_keys",
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("key_hash", sa.String(length=255), nullable=False),
        sa.Column("permissions", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], name=op.f("fk_api_keys_organization_id_organizations"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_api_keys")),
        sa.UniqueConstraint("key_hash", name=op.f("uq_api_keys_key_hash")),
    )
    op.create_index("ix_api_keys_key_hash", "api_keys", ["key_hash"], unique=False)
    op.create_index("ix_api_keys_organization_id", "api_keys", ["organization_id"], unique=False)

    op.create_table(
        "threat_events",
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("agent_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("threat_type", sa.String(length=120), nullable=False),
        sa.Column("severity", threat_severity_enum, server_default="MEDIUM", nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("raw_payload", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("source_ip", sa.String(length=45), nullable=True),
        sa.Column("detected_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["agent_id"], ["ai_agents.id"], name=op.f("fk_threat_events_agent_id_ai_agents"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], name=op.f("fk_threat_events_organization_id_organizations"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_threat_events")),
    )
    op.create_index("ix_threat_events_agent_id", "threat_events", ["agent_id"], unique=False)
    op.create_index("ix_threat_events_detected_at", "threat_events", ["detected_at"], unique=False)
    op.create_index("ix_threat_events_organization_id", "threat_events", ["organization_id"], unique=False)
    op.create_index("ix_threat_events_severity", "threat_events", ["severity"], unique=False)

    op.create_table(
        "audit_logs",
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("event_type", sa.String(length=120), nullable=False),
        sa.Column("severity", audit_severity_enum, server_default="LOW", nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], name=op.f("fk_audit_logs_organization_id_organizations"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_audit_logs_user_id_users"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_audit_logs")),
    )
    op.create_index("ix_audit_logs_organization_id", "audit_logs", ["organization_id"], unique=False)
    op.create_index("ix_audit_logs_severity", "audit_logs", ["severity"], unique=False)
    op.create_index("ix_audit_logs_timestamp", "audit_logs", ["timestamp"], unique=False)
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"], unique=False)

    op.create_table(
        "governance_decisions",
        sa.Column("threat_event_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("decision", governance_decision_enum, nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("risk_score", sa.Integer(), nullable=False),
        sa.Column("confidence_score", sa.Integer(), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("risk_score >= 0 AND risk_score <= 100", name="ck_governance_decisions_risk_score_range"),
        sa.CheckConstraint("confidence_score >= 0 AND confidence_score <= 100", name="ck_governance_decisions_confidence_score_range"),
        sa.ForeignKeyConstraint(["threat_event_id"], ["threat_events.id"], name=op.f("fk_governance_decisions_threat_event_id_threat_events"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_governance_decisions")),
    )
    op.create_index("ix_governance_decisions_decision", "governance_decisions", ["decision"], unique=False)
    op.create_index("ix_governance_decisions_threat_event_id", "governance_decisions", ["threat_event_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_governance_decisions_threat_event_id", table_name="governance_decisions")
    op.drop_index("ix_governance_decisions_decision", table_name="governance_decisions")
    op.drop_table("governance_decisions")

    op.drop_index("ix_audit_logs_user_id", table_name="audit_logs")
    op.drop_index("ix_audit_logs_timestamp", table_name="audit_logs")
    op.drop_index("ix_audit_logs_severity", table_name="audit_logs")
    op.drop_index("ix_audit_logs_organization_id", table_name="audit_logs")
    op.drop_table("audit_logs")

    op.drop_index("ix_threat_events_severity", table_name="threat_events")
    op.drop_index("ix_threat_events_organization_id", table_name="threat_events")
    op.drop_index("ix_threat_events_detected_at", table_name="threat_events")
    op.drop_index("ix_threat_events_agent_id", table_name="threat_events")
    op.drop_table("threat_events")

    op.drop_index("ix_api_keys_organization_id", table_name="api_keys")
    op.drop_index("ix_api_keys_key_hash", table_name="api_keys")
    op.drop_table("api_keys")

    op.drop_index("ix_policies_organization_id", table_name="policies")
    op.drop_index("ix_policies_enabled", table_name="policies")
    op.drop_table("policies")

    op.drop_index("ix_ai_agents_status", table_name="ai_agents")
    op.drop_index("ix_ai_agents_organization_id", table_name="ai_agents")
    op.drop_table("ai_agents")

    op.drop_index("ix_users_organization_id", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    op.drop_index("ix_organizations_status", table_name="organizations")
    op.drop_index("ix_organizations_slug", table_name="organizations")
    op.drop_table("organizations")

    governance_decision_enum.drop(op.get_bind(), checkfirst=True)
    governance_decision_type_enum.drop(op.get_bind(), checkfirst=True)
    audit_severity_enum.drop(op.get_bind(), checkfirst=True)
    threat_severity_enum.drop(op.get_bind(), checkfirst=True)
    agent_status_enum.drop(op.get_bind(), checkfirst=True)
    user_role_enum.drop(op.get_bind(), checkfirst=True)
    organization_status_enum.drop(op.get_bind(), checkfirst=True)
