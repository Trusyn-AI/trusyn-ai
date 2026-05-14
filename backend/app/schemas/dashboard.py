from __future__ import annotations

from datetime import datetime
from uuid import UUID

from app.models.enums import GovernanceDecisionType, ThreatSeverity
from app.schemas.base import ORMModel


class DashboardKPI(ORMModel):
    active_agents: int
    blocked_threats_24h: int
    avg_risk_score_24h: float
    policies_enabled: int


class DashboardThreatFeedItem(ORMModel):
    id: UUID
    threat_type: str
    severity: ThreatSeverity
    title: str
    description: str | None = None
    agent_id: UUID | None = None
    detected_at: datetime


class DashboardDecisionFeedItem(ORMModel):
    id: UUID
    threat_event_id: UUID
    decision: GovernanceDecisionType
    risk_score: int
    confidence_score: int
    reason: str | None = None
    created_at: datetime


class AgentActivitySnapshotItem(ORMModel):
    agent_id: UUID
    agent_name: str
    events_count_24h: int
    trust_score: int


class DailyThreatCountPoint(ORMModel):
    bucket: datetime
    count: int


class DecisionDistributionPoint(ORMModel):
    decision: GovernanceDecisionType
    count: int


class DashboardSummaryResponse(ORMModel):
    kpis: DashboardKPI
    recent_threats: list[DashboardThreatFeedItem]
    recent_decisions: list[DashboardDecisionFeedItem]
    agent_activity_snapshot: list[AgentActivitySnapshotItem]
    threat_count_by_day: list[DailyThreatCountPoint]
    decision_distribution: list[DecisionDistributionPoint]
