from __future__ import annotations

from datetime import datetime
from uuid import UUID

from app.models.enums import GovernanceDecisionType, OrganizationStatus, ThreatSeverity
from app.schemas.base import ORMModel


class AdminOrganizationItem(ORMModel):
    id: UUID
    name: str
    slug: str
    plan: str
    status: OrganizationStatus
    website: str | None = None
    created_at: datetime
    users_count: int
    active_agents_count: int
    policies_enabled_count: int
    threats_24h_count: int
    avg_risk_24h: float


class AdminPlatformKPI(ORMModel):
    total_organizations: int
    active_agents: int
    threats_blocked_24h: int
    requests_processed_24h: int
    avg_risk_score_24h: float


class AdminRecentThreatItem(ORMModel):
    id: UUID
    organization_id: UUID
    organization_name: str
    threat_type: str
    severity: ThreatSeverity
    title: str
    detected_at: datetime


class AdminDecisionDistributionPoint(ORMModel):
    decision: GovernanceDecisionType
    count: int


class AdminRiskLeaderboardItem(ORMModel):
    organization_id: UUID
    organization_name: str
    avg_risk_score: float
    threats_count_24h: int


class AdminPlatformOverviewResponse(ORMModel):
    kpis: AdminPlatformKPI
    recent_threats: list[AdminRecentThreatItem]
    decision_distribution: list[AdminDecisionDistributionPoint]
    risk_leaderboard: list[AdminRiskLeaderboardItem]


class AdminAPIMonitoringSummary(ORMModel):
    requests_per_second: float
    avg_latency_ms: float
    p95_latency_ms: float
    success_count: int
    blocked_count: int
    failed_count: int
    model_usage: dict[str, int]
    requests_by_hour: list[dict[str, float | str]]


class AdminAPIRequestItem(ORMModel):
    id: str
    timestamp: datetime
    organization_id: UUID
    organization_name: str
    agent_id: UUID | None = None
    agent_name: str | None = None
    endpoint: str
    status: str
    latency_ms: int
    model: str
    risk_score: int | None = None

