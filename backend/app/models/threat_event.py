from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseEntity
from app.models.enums import ThreatSeverity

if TYPE_CHECKING:
    from app.models.ai_agent import AIAgent
    from app.models.governance_decision import GovernanceDecision
    from app.models.organization import Organization


class ThreatEvent(BaseEntity):
    __tablename__ = "threat_events"
    __table_args__ = (
        Index("ix_threat_events_organization_id", "organization_id"),
        Index("ix_threat_events_agent_id", "agent_id"),
        Index("ix_threat_events_severity", "severity"),
        Index("ix_threat_events_detected_at", "detected_at"),
        Index("ix_threat_events_threat_type", "threat_type"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    agent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_agents.id", ondelete="SET NULL"),
        nullable=True,
    )
    threat_type: Mapped[str] = mapped_column(String(120), nullable=False)
    severity: Mapped[ThreatSeverity] = mapped_column(
        Enum(ThreatSeverity, name="threat_severity_enum"),
        nullable=False,
        default=ThreatSeverity.MEDIUM,
        server_default=ThreatSeverity.MEDIUM.value,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_payload: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )
    source_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    organization: Mapped["Organization"] = relationship(back_populates="threat_events", lazy="selectin")
    agent: Mapped["AIAgent | None"] = relationship(back_populates="threat_events", lazy="selectin")
    governance_decisions: Mapped[list["GovernanceDecision"]] = relationship(
        back_populates="threat_event",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="selectin",
    )
