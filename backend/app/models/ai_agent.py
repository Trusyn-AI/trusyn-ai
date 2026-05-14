from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseEntity, SoftDeleteMixin
from app.models.enums import AgentStatus

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.threat_event import ThreatEvent


class AIAgent(BaseEntity, SoftDeleteMixin):
    __tablename__ = "ai_agents"
    __table_args__ = (
        CheckConstraint("trust_score >= 0 AND trust_score <= 100", name="ck_ai_agents_trust_score_range"),
        Index("ix_ai_agents_organization_id", "organization_id"),
        Index("ix_ai_agents_status", "status"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[AgentStatus] = mapped_column(
        Enum(AgentStatus, name="agent_status_enum"),
        nullable=False,
        default=AgentStatus.OPERATIONAL,
        server_default=AgentStatus.OPERATIONAL.value,
    )
    trust_score: Mapped[int] = mapped_column(Integer, nullable=False, default=100, server_default="100")
    permissions: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )
    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )
    last_active_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    organization: Mapped["Organization"] = relationship(back_populates="agents", lazy="selectin")
    threat_events: Mapped[list["ThreatEvent"]] = relationship(back_populates="agent", lazy="selectin")
