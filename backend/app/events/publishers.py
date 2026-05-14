from __future__ import annotations

import uuid
from typing import Any

from app.events import event_bus
from app.events.event_models import (
    AgentStatusChangedEvent,
    AnomalyDetectedEvent,
    AuditEventCreatedEvent,
    GatewayRequestReceivedEvent,
    GovernanceRecommendationGeneratedEvent,
    GovernanceDecisionCreatedEvent,
    PlatformEvent,
    PolicyViolationEvent,
    RiskScoreUpdatedEvent,
    SystemHealthEvent,
    ThreatCorrelationDetectedEvent,
    ThreatDetectedEvent,
    TrustScoreChangedEvent,
)
from app.models.enums import GovernanceDecisionType, ThreatSeverity
from app.ws.channels import (
    governance_channel_for_org,
    intelligence_channel_for_org,
    platform_channel_for_org,
    system_health_channel,
    threat_channel_for_org,
)


async def publish_event(event: PlatformEvent) -> None:
    await event_bus.publish(event)


async def publish_gateway_request_received(
    *,
    organization_id: uuid.UUID,
    actor_user_id: uuid.UUID,
    agent_id: uuid.UUID,
    target_model: str,
    request_id: str | None,
) -> None:
    await publish_event(
        GatewayRequestReceivedEvent(
            organization_id=organization_id,
            actor_user_id=actor_user_id,
            agent_id=agent_id,
            request_id=request_id,
            severity=ThreatSeverity.LOW,
            channel=platform_channel_for_org(organization_id),
            payload={"target_model": target_model},
        )
    )


async def publish_threat_detected(
    *,
    organization_id: uuid.UUID,
    agent_id: uuid.UUID | None,
    severity: ThreatSeverity,
    threat_type: str,
    title: str,
    description: str,
    indicators: list[str],
    request_id: str | None,
) -> None:
    await publish_event(
        ThreatDetectedEvent(
            organization_id=organization_id,
            agent_id=agent_id,
            severity=severity,
            request_id=request_id,
            channel=threat_channel_for_org(organization_id),
            payload={
                "threat_type": threat_type,
                "title": title,
                "description": description,
                "indicators": indicators,
            },
        )
    )


async def publish_policy_violation(
    *,
    organization_id: uuid.UUID,
    agent_id: uuid.UUID | None,
    policy_id: str,
    policy_name: str,
    enforcement_action: GovernanceDecisionType,
    reason: str,
    request_id: str | None,
) -> None:
    await publish_event(
        PolicyViolationEvent(
            organization_id=organization_id,
            agent_id=agent_id,
            request_id=request_id,
            severity=ThreatSeverity.MEDIUM,
            channel=governance_channel_for_org(organization_id),
            payload={
                "policy_id": policy_id,
                "policy_name": policy_name,
                "enforcement_action": enforcement_action.value,
                "reason": reason,
            },
        )
    )


async def publish_risk_score_updated(
    *,
    organization_id: uuid.UUID,
    agent_id: uuid.UUID | None,
    risk_score: int,
    confidence_score: int,
    severity: ThreatSeverity,
    factors: list[str],
    request_id: str | None,
) -> None:
    await publish_event(
        RiskScoreUpdatedEvent(
            organization_id=organization_id,
            agent_id=agent_id,
            request_id=request_id,
            severity=severity,
            channel=governance_channel_for_org(organization_id),
            payload={
                "risk_score": risk_score,
                "confidence_score": confidence_score,
                "factors": factors,
            },
        )
    )


async def publish_governance_decision_created(
    *,
    organization_id: uuid.UUID,
    actor_user_id: uuid.UUID,
    agent_id: uuid.UUID,
    decision: GovernanceDecisionType,
    risk_score: int,
    confidence_score: int,
    reason: str,
    request_id: str | None,
    threat_event_id: uuid.UUID,
    governance_decision_id: uuid.UUID,
) -> None:
    await publish_event(
        GovernanceDecisionCreatedEvent(
            organization_id=organization_id,
            actor_user_id=actor_user_id,
            agent_id=agent_id,
            request_id=request_id,
            severity=ThreatSeverity.HIGH if decision != GovernanceDecisionType.ALLOW else ThreatSeverity.LOW,
            channel=governance_channel_for_org(organization_id),
            payload={
                "decision": decision.value,
                "risk_score": risk_score,
                "confidence_score": confidence_score,
                "reason": reason,
                "threat_event_id": str(threat_event_id),
                "governance_decision_id": str(governance_decision_id),
            },
        )
    )


async def publish_agent_status_changed(
    *,
    organization_id: uuid.UUID,
    actor_user_id: uuid.UUID,
    agent_id: uuid.UUID,
    old_status: str | None,
    new_status: str,
    request_id: str | None = None,
) -> None:
    await publish_event(
        AgentStatusChangedEvent(
            organization_id=organization_id,
            actor_user_id=actor_user_id,
            agent_id=agent_id,
            request_id=request_id,
            severity=ThreatSeverity.MEDIUM if new_status in {"QUARANTINED", "BLOCKED"} else ThreatSeverity.LOW,
            channel=platform_channel_for_org(organization_id),
            payload={"old_status": old_status, "new_status": new_status},
        )
    )


async def publish_audit_event_created(
    *,
    organization_id: uuid.UUID,
    actor_user_id: uuid.UUID | None,
    event_type: str,
    severity: ThreatSeverity,
    message: str,
    metadata: dict[str, Any] | None = None,
) -> None:
    await publish_event(
        AuditEventCreatedEvent(
            organization_id=organization_id,
            actor_user_id=actor_user_id,
            severity=severity,
            channel=platform_channel_for_org(organization_id),
            payload={
                "event_type": event_type,
                "message": message,
                "metadata": metadata or {},
            },
        )
    )


async def publish_system_health_event(*, payload: dict[str, Any], severity: ThreatSeverity = ThreatSeverity.LOW) -> None:
    await publish_event(
        SystemHealthEvent(
            organization_id=None,
            severity=severity,
            channel=system_health_channel(),
            payload=payload,
        )
    )


async def publish_anomaly_detected(
    *,
    organization_id: uuid.UUID,
    agent_id: uuid.UUID,
    anomaly_score: int,
    anomaly_type: str,
    confidence: int,
    reasoning: str,
    request_id: str | None,
) -> None:
    severity = ThreatSeverity.HIGH if anomaly_score >= 70 else ThreatSeverity.MEDIUM
    await publish_event(
        AnomalyDetectedEvent(
            organization_id=organization_id,
            agent_id=agent_id,
            request_id=request_id,
            severity=severity,
            channel=intelligence_channel_for_org(organization_id),
            payload={
                "anomaly_score": anomaly_score,
                "anomaly_type": anomaly_type,
                "confidence": confidence,
                "reasoning": reasoning,
            },
        )
    )


async def publish_trust_score_changed(
    *,
    organization_id: uuid.UUID,
    agent_id: uuid.UUID,
    trust_score: int,
    trend: str,
    delta: int,
    reasoning: list[str],
    request_id: str | None,
) -> None:
    severity = ThreatSeverity.HIGH if trend == "decreasing" and trust_score < 50 else ThreatSeverity.LOW
    await publish_event(
        TrustScoreChangedEvent(
            organization_id=organization_id,
            agent_id=agent_id,
            request_id=request_id,
            severity=severity,
            channel=intelligence_channel_for_org(organization_id),
            payload={
                "trust_score": trust_score,
                "trend": trend,
                "delta": delta,
                "reasoning": reasoning,
            },
        )
    )


async def publish_threat_correlation_detected(
    *,
    organization_id: uuid.UUID,
    agent_id: uuid.UUID,
    correlation_id: str,
    cluster_type: str,
    confidence: int,
    attack_chain: list[str],
    request_id: str | None,
) -> None:
    await publish_event(
        ThreatCorrelationDetectedEvent(
            organization_id=organization_id,
            agent_id=agent_id,
            request_id=request_id,
            severity=ThreatSeverity.HIGH,
            channel=intelligence_channel_for_org(organization_id),
            payload={
                "correlation_id": correlation_id,
                "cluster_type": cluster_type,
                "confidence": confidence,
                "attack_chain": attack_chain,
            },
        )
    )


async def publish_governance_recommendation_generated(
    *,
    organization_id: uuid.UUID,
    agent_id: uuid.UUID,
    recommendations: list[str],
    rationale: str,
    source: str,
    request_id: str | None,
) -> None:
    await publish_event(
        GovernanceRecommendationGeneratedEvent(
            organization_id=organization_id,
            agent_id=agent_id,
            request_id=request_id,
            severity=ThreatSeverity.LOW,
            channel=intelligence_channel_for_org(organization_id),
            payload={
                "recommendations": recommendations,
                "rationale": rationale,
                "source": source,
            },
        )
    )
