from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from uuid import UUID

from pydantic import Field

from app.models.enums import GovernanceDecisionType, ThreatSeverity
from app.schemas.base import ORMModel


class GatewayRequest(ORMModel):
    agent_id: UUID
    target_model: str
    prompt: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class ThreatDetectionItem(ORMModel):
    threat_type: str
    severity: ThreatSeverity
    title: str
    description: str
    indicators: list[str]
    confidence: int


class PolicyMatchItem(ORMModel):
    policy_id: UUID
    policy_name: str
    enforcement_action: GovernanceDecisionType
    reason: str


class GatewayDecisionData(ORMModel):
    decision: GovernanceDecisionType
    risk_score: int
    confidence_score: int
    threats_detected: list[ThreatDetectionItem]
    matched_policies: list[PolicyMatchItem]
    message: str
    threat_event_id: UUID
    governance_decision_id: UUID
    gemini_recommendation: str | None = None
    gemini_reasoning: str | None = None


@dataclass(slots=True)
class GovernanceContext:
    agent_id: UUID
    organization_id: UUID
    target_model: str
    prompt: str
    metadata: dict[str, Any]
    request_id: str | None
