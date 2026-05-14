from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.events.publishers import publish_audit_event_created
from app.models.enums import ThreatSeverity
from app.models.user import User
from app.repositories.audit_log_repository import AuditLogRepository


class AuditService:
    """Reusable audit event hooks for governance-sensitive actions."""

    async def create_audit_event(
        self,
        session: AsyncSession,
        *,
        organization_id: uuid.UUID,
        actor_user_id: uuid.UUID | None,
        event_type: str,
        severity: ThreatSeverity,
        message: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        repository = AuditLogRepository(session)
        await repository.create(
            {
                "organization_id": organization_id,
                "user_id": actor_user_id,
                "event_type": event_type,
                "severity": severity,
                "message": message,
                "metadata_json": metadata or {},
                "timestamp": datetime.now(UTC),
            }
        )
        await publish_audit_event_created(
            organization_id=organization_id,
            actor_user_id=actor_user_id,
            event_type=event_type,
            severity=severity,
            message=message,
            metadata=metadata,
        )

    async def create_user_action_event(
        self,
        session: AsyncSession,
        *,
        actor: User,
        event_type: str,
        severity: ThreatSeverity,
        message: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        await self.create_audit_event(
            session,
            organization_id=actor.organization_id,
            actor_user_id=actor.id,
            event_type=event_type,
            severity=severity,
            message=message,
            metadata=metadata,
        )
