from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import APIException
from app.events.publishers import publish_threat_detected
from app.models.enums import ThreatSeverity
from app.models.threat_event import ThreatEvent
from app.models.user import User
from app.observability.telemetry import telemetry_service
from app.repositories.ai_agent_repository import AIAgentRepository
from app.repositories.threat_event_repository import ThreatEventRepository
from app.schemas.pagination import PaginatedResult, PaginationQuery
from app.schemas.threat_event import ThreatIngestRequest
from app.services.alert_service import alert_service
from app.services.audit_service import AuditService
from app.services.base_service import BaseService


class ThreatService(BaseService):
    def __init__(self) -> None:
        self.audit_service = AuditService()

    async def ingest_threat(
        self,
        session: AsyncSession,
        *,
        current_user: User,
        payload: ThreatIngestRequest,
    ) -> ThreatEvent:
        organization_id = self.resolve_organization_id(current_user)
        agent_id = payload.agent_id

        if agent_id is not None:
            agent_repo = AIAgentRepository(session)
            agent = await agent_repo.get_by_id(agent_id, current_user=current_user)
            if agent is None:
                raise APIException(message="Agent not found", error_code="agent_not_found", status_code=404)

        repository = ThreatEventRepository(session)
        detected_at = payload.detected_at or datetime.now(UTC)

        threat = await repository.create(
            {
                "organization_id": organization_id,
                "agent_id": agent_id,
                "threat_type": payload.threat_type,
                "severity": payload.severity,
                "title": payload.title,
                "description": payload.description,
                "raw_payload": payload.raw_payload,
                "source_ip": payload.source_ip,
                "detected_at": detected_at,
            }
        )

        await self.audit_service.create_user_action_event(
            session,
            actor=current_user,
            event_type="threat_ingested",
            severity=payload.severity,
            message=f"Threat '{threat.title}' ingested",
            metadata={
                "threat_id": str(threat.id),
                "threat_type": threat.threat_type,
                "agent_id": str(threat.agent_id) if threat.agent_id else None,
            },
        )
        await publish_threat_detected(
            organization_id=threat.organization_id,
            agent_id=threat.agent_id,
            severity=threat.severity,
            threat_type=threat.threat_type,
            title=threat.title,
            description=threat.description or "",
            indicators=[],
            request_id=None,
        )
        await telemetry_service.record_threat_detected(severity=threat.severity)
        if threat.severity in {ThreatSeverity.HIGH, ThreatSeverity.CRITICAL}:
            await alert_service.publish_critical_threat_alert(
                title=threat.title,
                message=threat.description or "Threat ingested",
                metadata={"threat_id": str(threat.id), "organization_id": str(threat.organization_id)},
                severity=threat.severity,
            )
        await session.commit()
        return threat

    async def list_threats(
        self,
        session: AsyncSession,
        *,
        current_user: User,
        pagination: PaginationQuery,
        severity: ThreatSeverity | None = None,
    ) -> PaginatedResult[ThreatEvent]:
        repository = ThreatEventRepository(session)
        filters: dict[str, Any] = {"severity": severity} if severity else {}

        items = await repository.list(
            current_user=current_user,
            limit=pagination.limit,
            offset=pagination.offset,
            sort_by=pagination.sort_by,
            sort_order=pagination.sort_order,
            filters=filters,
        )
        total = await repository.count(current_user=current_user, filters=filters)
        return PaginatedResult[ThreatEvent](
            items=items,
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def get_threat(self, session: AsyncSession, *, current_user: User, threat_id: UUID) -> ThreatEvent:
        repository = ThreatEventRepository(session)
        threat = await repository.get_by_id(threat_id, current_user=current_user)
        if threat is None:
            raise APIException(message="Threat not found", error_code="threat_not_found", status_code=404)
        return threat
