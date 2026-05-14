from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import APIException
from app.models.ai_agent import AIAgent
from app.models.enums import GovernanceDecisionType, ThreatSeverity
from app.models.governance_decision import GovernanceDecision
from app.models.policy import Policy
from app.models.threat_event import ThreatEvent
from app.models.user import User
from app.schemas.analytics import (
    AnalyticsAgentTrustTrendsResponse,
    AnalyticsDecisionDistributionResponse,
    AnalyticsOverviewResponse,
    AnalyticsPolicyImpactResponse,
    AnalyticsQuery,
    AnalyticsRiskTrendsResponse,
    AgentTrustTrendPoint,
    DecisionTrendPoint,
    PolicyImpactPoint,
    RiskTrendPoint,
)
from app.services.base_service import BaseService


class AnalyticsService(BaseService):
    def _range(self, query: AnalyticsQuery) -> tuple[datetime, datetime]:
        end_at = query.end_at or datetime.now(UTC)
        start_at = query.start_at or (end_at - timedelta(days=30))
        if end_at < start_at:
            raise APIException(
                message="end_at must be greater than or equal to start_at",
                error_code="invalid_time_range",
                status_code=422,
            )
        return start_at, end_at

    def _bucket(self, granularity: str):
        if granularity == "hour":
            return func.date_trunc("hour", ThreatEvent.detected_at)
        if granularity == "week":
            return func.date_trunc("week", ThreatEvent.detected_at)
        return func.date_trunc("day", ThreatEvent.detected_at)

    async def overview(self, session: AsyncSession, *, current_user: User, query: AnalyticsQuery) -> AnalyticsOverviewResponse:
        org_id = self.resolve_organization_id(current_user, query.organization_id)
        start_at, end_at = self._range(query)

        threat_filter = [
            ThreatEvent.organization_id == org_id,
            ThreatEvent.detected_at >= start_at,
            ThreatEvent.detected_at <= end_at,
        ]
        if query.agent_id:
            threat_filter.append(ThreatEvent.agent_id == query.agent_id)

        total_threats = int((await session.scalar(select(func.count()).select_from(ThreatEvent).where(*threat_filter))) or 0)

        decision_filter = [
            ThreatEvent.organization_id == org_id,
            GovernanceDecision.created_at >= start_at,
            GovernanceDecision.created_at <= end_at,
        ]
        if query.agent_id:
            decision_filter.append(ThreatEvent.agent_id == query.agent_id)

        total_decisions = int(
            (
                await session.scalar(
                    select(func.count())
                    .select_from(GovernanceDecision)
                    .join(ThreatEvent, ThreatEvent.id == GovernanceDecision.threat_event_id)
                    .where(*decision_filter)
                )
            )
            or 0
        )

        blocked_decisions = int(
            (
                await session.scalar(
                    select(func.count())
                    .select_from(GovernanceDecision)
                    .join(ThreatEvent, ThreatEvent.id == GovernanceDecision.threat_event_id)
                    .where(*decision_filter, GovernanceDecision.decision == GovernanceDecisionType.BLOCK)
                )
            )
            or 0
        )

        average_risk_score = float(
            (
                await session.scalar(
                    select(func.avg(GovernanceDecision.risk_score))
                    .join(ThreatEvent, ThreatEvent.id == GovernanceDecision.threat_event_id)
                    .where(*decision_filter)
                )
            )
            or 0.0
        )

        active_agents = int(
            (
                await session.scalar(
                    select(func.count())
                    .select_from(AIAgent)
                    .where(AIAgent.organization_id == org_id, AIAgent.is_deleted.is_(False))
                )
            )
            or 0
        )

        policy_stmt = select(func.count()).select_from(Policy).where(
            Policy.organization_id == org_id,
            Policy.is_deleted.is_(False),
            Policy.enabled.is_(True),
        )
        if query.policy_id is not None:
            policy_stmt = policy_stmt.where(Policy.id == query.policy_id)
        policy_count_enabled = int((await session.scalar(policy_stmt)) or 0)

        return AnalyticsOverviewResponse(
            total_threats=total_threats,
            total_decisions=total_decisions,
            blocked_decisions=blocked_decisions,
            average_risk_score=round(average_risk_score, 2),
            active_agents=active_agents,
            policy_count_enabled=policy_count_enabled,
        )

    async def risk_trends(
        self,
        session: AsyncSession,
        *,
        current_user: User,
        query: AnalyticsQuery,
    ) -> AnalyticsRiskTrendsResponse:
        org_id = self.resolve_organization_id(current_user, query.organization_id)
        start_at, end_at = self._range(query)
        bucket = self._bucket(query.granularity)

        statement = (
            select(bucket.label("bucket"), ThreatEvent.severity, func.count().label("count"))
            .where(
                ThreatEvent.organization_id == org_id,
                ThreatEvent.detected_at >= start_at,
                ThreatEvent.detected_at <= end_at,
            )
            .group_by(bucket, ThreatEvent.severity)
            .order_by(bucket.asc())
        )
        if query.agent_id is not None:
            statement = statement.where(ThreatEvent.agent_id == query.agent_id)

        rows = (await session.execute(statement)).all()
        return AnalyticsRiskTrendsResponse(
            items=[RiskTrendPoint(bucket=row.bucket, severity=row.severity, count=int(row.count)) for row in rows]
        )

    async def decision_distribution(
        self,
        session: AsyncSession,
        *,
        current_user: User,
        query: AnalyticsQuery,
    ) -> AnalyticsDecisionDistributionResponse:
        org_id = self.resolve_organization_id(current_user, query.organization_id)
        start_at, end_at = self._range(query)

        statement = (
            select(GovernanceDecision.decision, func.count().label("count"))
            .join(ThreatEvent, ThreatEvent.id == GovernanceDecision.threat_event_id)
            .where(
                ThreatEvent.organization_id == org_id,
                GovernanceDecision.created_at >= start_at,
                GovernanceDecision.created_at <= end_at,
            )
            .group_by(GovernanceDecision.decision)
            .order_by(func.count().desc())
        )
        if query.agent_id is not None:
            statement = statement.where(ThreatEvent.agent_id == query.agent_id)

        rows = (await session.execute(statement)).all()
        return AnalyticsDecisionDistributionResponse(
            items=[DecisionTrendPoint(decision=row.decision, count=int(row.count)) for row in rows]
        )

    async def agent_trust_trends(
        self,
        session: AsyncSession,
        *,
        current_user: User,
        query: AnalyticsQuery,
    ) -> AnalyticsAgentTrustTrendsResponse:
        org_id = self.resolve_organization_id(current_user, query.organization_id)

        statement = select(AIAgent).where(AIAgent.organization_id == org_id, AIAgent.is_deleted.is_(False)).order_by(
            AIAgent.trust_score.desc()
        )
        if query.agent_id is not None:
            statement = statement.where(AIAgent.id == query.agent_id)
        rows = (await session.scalars(statement.limit(50))).all()

        return AnalyticsAgentTrustTrendsResponse(
            items=[
                AgentTrustTrendPoint(
                    agent_id=agent.id,
                    agent_name=agent.name,
                    trust_score=agent.trust_score,
                    status=agent.status.value,
                )
                for agent in rows
            ]
        )

    async def policy_impact(
        self,
        session: AsyncSession,
        *,
        current_user: User,
        query: AnalyticsQuery,
    ) -> AnalyticsPolicyImpactResponse:
        org_id = self.resolve_organization_id(current_user, query.organization_id)

        statement = select(Policy).where(
            Policy.organization_id == org_id,
            Policy.is_deleted.is_(False),
        )
        if query.policy_id is not None:
            statement = statement.where(Policy.id == query.policy_id)

        policies = (await session.scalars(statement.order_by(Policy.created_at.desc()).limit(50))).all()

        items: list[PolicyImpactPoint] = []
        for policy in policies:
            matched_count = int(
                (
                    await session.scalar(
                        select(func.count())
                        .select_from(ThreatEvent)
                        .where(
                            ThreatEvent.organization_id == org_id,
                            ThreatEvent.detected_at >= (query.start_at or datetime.now(UTC) - timedelta(days=30)),
                            ThreatEvent.raw_payload["matched_policy_ids"].astext.ilike(f"%{policy.id}%"),
                        )
                    )
                )
                or 0
            )
            items.append(
                PolicyImpactPoint(
                    policy_id=policy.id,
                    policy_name=policy.name,
                    enforcement_action=policy.enforcement_action,
                    related_events=matched_count,
                )
            )

        return AnalyticsPolicyImpactResponse(items=items)
