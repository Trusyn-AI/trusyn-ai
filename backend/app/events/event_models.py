from __future__ import annotations

import uuid
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import GovernanceDecisionType, ThreatSeverity


class EventType(StrEnum):
    GOVERNANCE_DECISION_CREATED = "governance.decision.created"
    THREAT_DETECTED = "threat.detected"
    POLICY_VIOLATION = "policy.violation"
    AGENT_STATUS_CHANGED = "agent.status.changed"
    RISK_SCORE_UPDATED = "risk.score.updated"
    AUDIT_EVENT_CREATED = "audit.event.created"
    GATEWAY_REQUEST_RECEIVED = "gateway.request.received"
    SYSTEM_HEALTH_EVENT = "system.health.event"
    ANOMALY_DETECTED = "intelligence.anomaly.detected"
    TRUST_SCORE_CHANGED = "intelligence.trust.score_changed"
    THREAT_CORRELATION_DETECTED = "intelligence.threat.correlation_detected"
    GOVERNANCE_RECOMMENDATION_GENERATED = "intelligence.governance.recommendation_generated"


class PlatformEvent(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    event_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    event_type: EventType
    organization_id: uuid.UUID | None = None
    actor_user_id: uuid.UUID | None = None
    agent_id: uuid.UUID | None = None
    request_id: str | None = None
    severity: ThreatSeverity | None = None
    channel: str = "platform.global"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    payload: dict[str, Any] = Field(default_factory=dict)
    tags: list[str] = Field(default_factory=list)


class GovernanceDecisionCreatedEvent(PlatformEvent):
    event_type: EventType = EventType.GOVERNANCE_DECISION_CREATED


class ThreatDetectedEvent(PlatformEvent):
    event_type: EventType = EventType.THREAT_DETECTED


class PolicyViolationEvent(PlatformEvent):
    event_type: EventType = EventType.POLICY_VIOLATION


class AgentStatusChangedEvent(PlatformEvent):
    event_type: EventType = EventType.AGENT_STATUS_CHANGED


class RiskScoreUpdatedEvent(PlatformEvent):
    event_type: EventType = EventType.RISK_SCORE_UPDATED


class AuditEventCreatedEvent(PlatformEvent):
    event_type: EventType = EventType.AUDIT_EVENT_CREATED


class GatewayRequestReceivedEvent(PlatformEvent):
    event_type: EventType = EventType.GATEWAY_REQUEST_RECEIVED


class SystemHealthEvent(PlatformEvent):
    event_type: EventType = EventType.SYSTEM_HEALTH_EVENT


class AnomalyDetectedEvent(PlatformEvent):
    event_type: EventType = EventType.ANOMALY_DETECTED


class TrustScoreChangedEvent(PlatformEvent):
    event_type: EventType = EventType.TRUST_SCORE_CHANGED


class ThreatCorrelationDetectedEvent(PlatformEvent):
    event_type: EventType = EventType.THREAT_CORRELATION_DETECTED


class GovernanceRecommendationGeneratedEvent(PlatformEvent):
    event_type: EventType = EventType.GOVERNANCE_RECOMMENDATION_GENERATED


class GovernanceDecisionPayload(BaseModel):
    decision: GovernanceDecisionType
    risk_score: int
    confidence_score: int
    reason: str


class ThreatPayload(BaseModel):
    threat_type: str
    title: str
    description: str
    indicators: list[str] = Field(default_factory=list)
