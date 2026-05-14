from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, Enum, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseEntity, SoftDeleteMixin
from app.models.enums import GovernanceDecisionType

if TYPE_CHECKING:
    from app.models.organization import Organization


class Policy(BaseEntity, SoftDeleteMixin):
    __tablename__ = "policies"
    __table_args__ = (
        Index("ix_policies_organization_id", "organization_id"),
        Index("ix_policies_enabled", "enabled"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    rule_definition: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )
    enforcement_action: Mapped[GovernanceDecisionType] = mapped_column(
        Enum(GovernanceDecisionType, name="governance_decision_type_enum"),
        nullable=False,
        default=GovernanceDecisionType.REVIEW,
        server_default=GovernanceDecisionType.REVIEW.value,
    )
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")

    organization: Mapped["Organization"] = relationship(back_populates="policies", lazy="selectin")
