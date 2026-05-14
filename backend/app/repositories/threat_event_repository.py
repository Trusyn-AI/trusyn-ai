from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Select, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.threat_event import ThreatEvent
from app.models.user import User
from app.repositories.base import BaseRepository


class ThreatEventRepository(BaseRepository[ThreatEvent]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, ThreatEvent)

    async def list_recent_for_org(self, *, organization_id: uuid.UUID, limit: int = 10) -> list[ThreatEvent]:
        statement = (
            select(ThreatEvent)
            .where(ThreatEvent.organization_id == organization_id)
            .order_by(ThreatEvent.detected_at.desc())
            .limit(limit)
        )
        rows = await self.session.scalars(statement)
        return list(rows.all())

    async def related_threats(
        self,
        *,
        organization_id: uuid.UUID,
        threat_type: str,
        agent_id: uuid.UUID | None,
        detected_at: datetime,
        exclude_threat_id: uuid.UUID,
        limit: int = 10,
    ) -> list[ThreatEvent]:
        start_at = detected_at.replace(hour=0, minute=0, second=0, microsecond=0)
        statement = select(ThreatEvent).where(
            ThreatEvent.organization_id == organization_id,
            ThreatEvent.id != exclude_threat_id,
            ThreatEvent.detected_at >= start_at,
        )
        if agent_id is not None:
            statement = statement.where(
                (ThreatEvent.agent_id == agent_id) | (ThreatEvent.threat_type == threat_type)
            )
        else:
            statement = statement.where(ThreatEvent.threat_type == threat_type)

        statement = statement.order_by(ThreatEvent.detected_at.desc()).limit(limit)
        rows = await self.session.scalars(statement)
        return list(rows.all())

    async def count_by_org_since(self, *, organization_id: uuid.UUID, start_at: datetime) -> int:
        statement = select(func.count()).select_from(ThreatEvent).where(
            ThreatEvent.organization_id == organization_id,
            ThreatEvent.detected_at >= start_at,
        )
        return int((await self.session.scalar(statement)) or 0)

    async def count_by_org_and_severity_since(self, *, organization_id: uuid.UUID, start_at: datetime) -> list[tuple[object, int]]:
        statement = (
            select(ThreatEvent.severity, func.count())
            .where(
                ThreatEvent.organization_id == organization_id,
                ThreatEvent.detected_at >= start_at,
            )
            .group_by(ThreatEvent.severity)
            .order_by(desc(func.count()))
        )
        rows = await self.session.execute(statement)
        return list(rows.all())
