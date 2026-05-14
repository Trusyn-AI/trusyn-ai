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
    from app.models.organization import Organization
    from app.models.user import User


class AuditLog(BaseEntity):
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_organization_id", "organization_id"),
        Index("ix_audit_logs_user_id", "user_id"),
        Index("ix_audit_logs_timestamp", "timestamp"),
        Index("ix_audit_logs_severity", "severity"),
        Index("ix_audit_logs_event_type", "event_type"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    event_type: Mapped[str] = mapped_column(String(120), nullable=False)
    severity: Mapped[ThreatSeverity] = mapped_column(
        Enum(ThreatSeverity, name="audit_severity_enum"),
        nullable=False,
        default=ThreatSeverity.LOW,
        server_default=ThreatSeverity.LOW.value,
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    organization: Mapped["Organization"] = relationship(back_populates="audit_logs", lazy="selectin")
    user: Mapped["User | None"] = relationship(back_populates="audit_logs", lazy="selectin")
