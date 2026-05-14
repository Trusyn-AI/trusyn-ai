from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.models.enums import GovernanceDecisionType, ThreatSeverity
from app.schemas.base import ORMModel


class AnalyticsQuery(ORMModel):
    start_at: datetime | None = None
    end_at: datetime | None = None
    granularity: str = Field(default="day", pattern="^(hour|day|week)$")
    agent_id: UUID | None = None
    policy_id: UUID | None = None
    organization_id: UUID | None = None


class TimeSeriesPoint(ORMModel):
    bucket: datetime
    value: float


class CategoricalSeriesPoint(ORMModel):
    label: str
    value: int


class RiskTrendPoint(ORMModel):
    bucket: datetime
    severity: ThreatSeverity
    count: int


class DecisionTrendPoint(ORMModel):
    decision: GovernanceDecisionType
    count: int


class AgentTrustTrendPoint(ORMModel):
    agent_id: UUID
    agent_name: str
    trust_score: int
    status: str


class PolicyImpactPoint(ORMModel):
    policy_id: UUID
    policy_name: str
    enforcement_action: GovernanceDecisionType
    related_events: int


class AnalyticsOverviewResponse(ORMModel):
    total_threats: int
    total_decisions: int
    blocked_decisions: int
    average_risk_score: float
    active_agents: int
    policy_count_enabled: int


class AnalyticsRiskTrendsResponse(ORMModel):
    items: list[RiskTrendPoint]


class AnalyticsDecisionDistributionResponse(ORMModel):
    items: list[DecisionTrendPoint]


class AnalyticsAgentTrustTrendsResponse(ORMModel):
    items: list[AgentTrustTrendPoint]


class AnalyticsPolicyImpactResponse(ORMModel):
    items: list[PolicyImpactPoint]
