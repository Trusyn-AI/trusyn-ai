from __future__ import annotations

from datetime import datetime
from uuid import UUID

from app.models.enums import GovernanceDecisionType, ThreatSeverity
from app.schemas.base import ORMModel


class InvestigationPolicyReference(ORMModel):
    policy_id: UUID
    name: str
    enforcement_action: GovernanceDecisionType


class InvestigationDecision(ORMModel):
    governance_decision_id: UUID
    decision: GovernanceDecisionType
    risk_score: int
    confidence_score: int
    reason: str | None = None
    created_at: datetime


class InvestigationTimelineEntry(ORMModel):
    event_type: str
    timestamp: datetime
    severity: ThreatSeverity
    message: str


class RelatedThreat(ORMModel):
    threat_id: UUID
    threat_type: str
    severity: ThreatSeverity
    title: str
    detected_at: datetime


class ThreatInvestigationResponse(ORMModel):
    threat_id: UUID
    organization_id: UUID
    agent_id: UUID | None
    threat_type: str
    severity: ThreatSeverity
    title: str
    description: str | None
    detected_at: datetime
    source_ip: str | None
    raw_payload: dict[str, object]
    decisions: list[InvestigationDecision]
    matched_policies: list[InvestigationPolicyReference]
    risk_reasoning_summary: str
    timeline: list[InvestigationTimelineEntry]
    related_threats: list[RelatedThreat]
    explainability_summary: str | None = None
