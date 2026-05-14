from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_agent import AIAgent
from app.models.enums import GovernanceDecisionType
from app.models.governance_decision import GovernanceDecision
from app.models.policy import Policy
from app.models.threat_event import ThreatEvent
from app.models.user import User
from app.repositories.governance_decision_repository import GovernanceDecisionRepository
from app.repositories.threat_event_repository import ThreatEventRepository
from app.schemas.dashboard import (
    AgentActivitySnapshotItem,
    DashboardDecisionFeedItem,
    DashboardKPI,
    DashboardSummaryResponse,
    DashboardThreatFeedItem,
    DecisionDistributionPoint,
    DailyThreatCountPoint,
)
from app.services.base_service import BaseService


class DashboardService(BaseService):
    async def get_summary(self, session: AsyncSession, *, current_user: User) -> DashboardSummaryResponse:
        org_id = self.resolve_organization_id(current_user)
        now = datetime.now(UTC)
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)

        active_agents = int(
            (
                await session.scalar(
                    select(func.count())
                    .select_from(AIAgent)
                    .where(
                        AIAgent.organization_id == org_id,
                        AIAgent.is_deleted.is_(False),
                    )
                )
            )
            or 0
        )

        blocked_threats_24h = int(
            (
                await session.scalar(
                    select(func.count())
                    .select_from(GovernanceDecision)
                    .join(ThreatEvent, ThreatEvent.id == GovernanceDecision.threat_event_id)
                    .where(
                        ThreatEvent.organization_id == org_id,
                        GovernanceDecision.decision == GovernanceDecisionType.BLOCK,
                        GovernanceDecision.created_at >= last_24h,
                    )
                )
            )
            or 0
        )

        avg_risk_score_24h = float(
            (
                await session.scalar(
                    select(func.avg(GovernanceDecision.risk_score))
                    .join(ThreatEvent, ThreatEvent.id == GovernanceDecision.threat_event_id)
                    .where(
                        ThreatEvent.organization_id == org_id,
                        GovernanceDecision.created_at >= last_24h,
                    )
                )
            )
            or 0.0
        )

        policies_enabled = int(
            (
                await session.scalar(
                    select(func.count())
                    .select_from(Policy)
                    .where(
                        Policy.organization_id == org_id,
                        Policy.is_deleted.is_(False),
                        Policy.enabled.is_(True),
                    )
                )
            )
            or 0
        )

        threat_repo = ThreatEventRepository(session)
        decision_repo = GovernanceDecisionRepository(session)
        threats = await threat_repo.list_recent_for_org(organization_id=org_id, limit=8)
        decisions = await decision_repo.list_recent_for_org(organization_id=org_id, limit=8)

        agent_activity_stmt = (
            select(
                AIAgent.id,
                AIAgent.name,
                AIAgent.trust_score,
                func.count(ThreatEvent.id).label("events_count_24h"),
            )
            .outerjoin(
                ThreatEvent,
                (ThreatEvent.agent_id == AIAgent.id) & (ThreatEvent.detected_at >= last_24h),
            )
            .where(
                AIAgent.organization_id == org_id,
                AIAgent.is_deleted.is_(False),
            )
            .group_by(AIAgent.id)
            .order_by(func.count(ThreatEvent.id).desc(), AIAgent.name.asc())
            .limit(6)
        )
        agent_rows = (await session.execute(agent_activity_stmt)).all()

        # Timeseries: uses PostgreSQL date_trunc for stable dashboard chart buckets.
        threat_by_day_stmt = (
            select(func.date_trunc("day", ThreatEvent.detected_at).label("bucket"), func.count().label("count"))
            .where(
                ThreatEvent.organization_id == org_id,
                ThreatEvent.detected_at >= last_7d,
            )
            .group_by(func.date_trunc("day", ThreatEvent.detected_at))
            .order_by(func.date_trunc("day", ThreatEvent.detected_at).asc())
        )
        threat_day_rows = (await session.execute(threat_by_day_stmt)).all()

        decision_dist_stmt = (
            select(GovernanceDecision.decision, func.count().label("count"))
            .join(ThreatEvent, ThreatEvent.id == GovernanceDecision.threat_event_id)
            .where(
                ThreatEvent.organization_id == org_id,
                GovernanceDecision.created_at >= last_7d,
            )
            .group_by(GovernanceDecision.decision)
            .order_by(func.count().desc())
        )
        decision_dist_rows = (await session.execute(decision_dist_stmt)).all()

        return DashboardSummaryResponse(
            kpis=DashboardKPI(
                active_agents=active_agents,
                blocked_threats_24h=blocked_threats_24h,
                avg_risk_score_24h=round(avg_risk_score_24h, 2),
                policies_enabled=policies_enabled,
            ),
            recent_threats=[
                DashboardThreatFeedItem(
                    id=threat.id,
                    threat_type=threat.threat_type,
                    severity=threat.severity,
                    title=threat.title,
                    description=threat.description,
                    agent_id=threat.agent_id,
                    detected_at=threat.detected_at,
                )
                for threat in threats
            ],
            recent_decisions=[
                DashboardDecisionFeedItem(
                    id=item.id,
                    threat_event_id=item.threat_event_id,
                    decision=item.decision,
                    risk_score=item.risk_score,
                    confidence_score=item.confidence_score,
                    reason=item.reason,
                    created_at=item.created_at,
                )
                for item in decisions
            ],
            agent_activity_snapshot=[
                AgentActivitySnapshotItem(
                    agent_id=row.id,
                    agent_name=row.name,
                    trust_score=row.trust_score,
                    events_count_24h=int(row.events_count_24h or 0),
                )
                for row in agent_rows
            ],
            threat_count_by_day=[
                DailyThreatCountPoint(bucket=row.bucket, count=int(row.count))
                for row in threat_day_rows
            ],
            decision_distribution=[
                DecisionDistributionPoint(decision=row.decision, count=int(row.count))
                for row in decision_dist_rows
            ],
        )
