from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Enum, Index, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseEntity, SoftDeleteMixin
from app.models.enums import OrganizationStatus

if TYPE_CHECKING:
    from app.models.ai_agent import AIAgent
    from app.models.api_key import APIKey
    from app.models.audit_log import AuditLog
    from app.models.policy import Policy
    from app.models.threat_event import ThreatEvent
    from app.models.user import User


class Organization(BaseEntity, SoftDeleteMixin):
    __tablename__ = "organizations"
    __table_args__ = (
        Index("ix_organizations_slug", "slug"),
        Index("ix_organizations_status", "status"),
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    plan: Mapped[str] = mapped_column(String(100), nullable=False, default="starter", server_default="starter")
    status: Mapped[OrganizationStatus] = mapped_column(
        Enum(OrganizationStatus, name="organization_status_enum"),
        nullable=False,
        default=OrganizationStatus.ACTIVE,
        server_default=OrganizationStatus.ACTIVE.value,
    )
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    settings_json: Mapped[dict[str, object]] = mapped_column(
        "settings",
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )

    users: Mapped[list["User"]] = relationship(
        back_populates="organization",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="selectin",
    )
    agents: Mapped[list["AIAgent"]] = relationship(
        back_populates="organization",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="selectin",
    )
    policies: Mapped[list["Policy"]] = relationship(
        back_populates="organization",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="selectin",
    )
    threat_events: Mapped[list["ThreatEvent"]] = relationship(
        back_populates="organization",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="selectin",
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship(
        back_populates="organization",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="selectin",
    )
    api_keys: Mapped[list["APIKey"]] = relationship(
        back_populates="organization",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="selectin",
    )
