from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.governance_decision import GovernanceDecision
from app.models.threat_event import ThreatEvent
from app.repositories.base import BaseRepository


class GovernanceDecisionRepository(BaseRepository[GovernanceDecision]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, GovernanceDecision)

    async def list_recent_for_org(self, *, organization_id: uuid.UUID, limit: int = 10) -> list[GovernanceDecision]:
        statement = (
            select(GovernanceDecision)
            .join(ThreatEvent, ThreatEvent.id == GovernanceDecision.threat_event_id)
            .where(ThreatEvent.organization_id == organization_id)
            .order_by(GovernanceDecision.created_at.desc())
            .limit(limit)
        )
        rows = await self.session.scalars(statement)
        return list(rows.all())

    async def count_by_org_since(self, *, organization_id: uuid.UUID, start_at: datetime) -> int:
        statement = (
            select(func.count())
            .select_from(GovernanceDecision)
            .join(ThreatEvent, ThreatEvent.id == GovernanceDecision.threat_event_id)
            .where(
                ThreatEvent.organization_id == organization_id,
                GovernanceDecision.created_at >= start_at,
            )
        )
        return int((await self.session.scalar(statement)) or 0)

    async def avg_risk_score_by_org_since(self, *, organization_id: uuid.UUID, start_at: datetime) -> float:
        statement = (
            select(func.avg(GovernanceDecision.risk_score))
            .select_from(GovernanceDecision)
            .join(ThreatEvent, ThreatEvent.id == GovernanceDecision.threat_event_id)
            .where(
                ThreatEvent.organization_id == organization_id,
                GovernanceDecision.created_at >= start_at,
            )
        )
        value = await self.session.scalar(statement)
        return float(value or 0.0)

    async def distribution_by_org_since(self, *, organization_id: uuid.UUID, start_at: datetime) -> list[tuple[object, int]]:
        statement = (
            select(GovernanceDecision.decision, func.count())
            .join(ThreatEvent, ThreatEvent.id == GovernanceDecision.threat_event_id)
            .where(
                ThreatEvent.organization_id == organization_id,
                GovernanceDecision.created_at >= start_at,
            )
            .group_by(GovernanceDecision.decision)
            .order_by(desc(func.count()))
        )
        rows = await self.session.execute(statement)
        return list(rows.all())

    async def list_for_threat(self, *, threat_event_id: uuid.UUID) -> list[GovernanceDecision]:
        statement = (
            select(GovernanceDecision)
            .where(GovernanceDecision.threat_event_id == threat_event_id)
            .order_by(GovernanceDecision.created_at.asc())
        )
        rows = await self.session.scalars(statement)
        return list(rows.all())
