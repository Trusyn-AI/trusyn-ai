from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Enum, ForeignKey, Index, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseEntity
from app.models.enums import GovernanceDecisionType

if TYPE_CHECKING:
    from app.models.threat_event import ThreatEvent


class GovernanceDecision(BaseEntity):
    __tablename__ = "governance_decisions"
    __table_args__ = (
        CheckConstraint("risk_score >= 0 AND risk_score <= 100", name="ck_governance_decisions_risk_score_range"),
        CheckConstraint(
            "confidence_score >= 0 AND confidence_score <= 100",
            name="ck_governance_decisions_confidence_score_range",
        ),
        Index("ix_governance_decisions_decision", "decision"),
        Index("ix_governance_decisions_threat_event_id", "threat_event_id"),
        Index("ix_governance_decisions_created_at", "created_at"),
    )

    threat_event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("threat_events.id", ondelete="CASCADE"),
        nullable=False,
    )
    decision: Mapped[GovernanceDecisionType] = mapped_column(
        Enum(GovernanceDecisionType, name="governance_decision_enum"),
        nullable=False,
    )
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False)
    confidence_score: Mapped[int] = mapped_column(Integer, nullable=False)

    threat_event: Mapped["ThreatEvent"] = relationship(back_populates="governance_decisions", lazy="selectin")
