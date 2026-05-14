from __future__ import annotations

import uuid

from app.events.event_models import EventType, PlatformEvent


PLATFORM_GLOBAL_CHANNEL = "platform.global"
THREATS_GLOBAL_CHANNEL = "threats.global"
GOVERNANCE_GLOBAL_CHANNEL = "governance.global"
SYSTEM_HEALTH_GLOBAL_CHANNEL = "system.health.global"
INTELLIGENCE_GLOBAL_CHANNEL = "intelligence.global"


def platform_channel_for_org(organization_id: uuid.UUID) -> str:
    return f"platform.org.{organization_id}"


def threat_channel_for_org(organization_id: uuid.UUID) -> str:
    return f"threats.org.{organization_id}"


def governance_channel_for_org(organization_id: uuid.UUID) -> str:
    return f"governance.org.{organization_id}"


def system_health_channel() -> str:
    return SYSTEM_HEALTH_GLOBAL_CHANNEL


def intelligence_channel_for_org(organization_id: uuid.UUID) -> str:
    return f"intelligence.org.{organization_id}"


def channels_for_event(event: PlatformEvent) -> list[str]:
    channels = {event.channel, PLATFORM_GLOBAL_CHANNEL}

    if event.organization_id:
        channels.add(platform_channel_for_org(event.organization_id))

    if event.event_type in {EventType.THREAT_DETECTED, EventType.POLICY_VIOLATION}:
        channels.add(THREATS_GLOBAL_CHANNEL)
        if event.organization_id:
            channels.add(threat_channel_for_org(event.organization_id))

    if event.event_type in {
        EventType.GOVERNANCE_DECISION_CREATED,
        EventType.RISK_SCORE_UPDATED,
        EventType.GATEWAY_REQUEST_RECEIVED,
        EventType.POLICY_VIOLATION,
    }:
        channels.add(GOVERNANCE_GLOBAL_CHANNEL)
        if event.organization_id:
            channels.add(governance_channel_for_org(event.organization_id))

    if event.event_type == EventType.SYSTEM_HEALTH_EVENT:
        channels.add(SYSTEM_HEALTH_GLOBAL_CHANNEL)

    if event.event_type in {
        EventType.ANOMALY_DETECTED,
        EventType.TRUST_SCORE_CHANGED,
        EventType.THREAT_CORRELATION_DETECTED,
        EventType.GOVERNANCE_RECOMMENDATION_GENERATED,
    }:
        channels.add(INTELLIGENCE_GLOBAL_CHANNEL)
        if event.organization_id:
            channels.add(intelligence_channel_for_org(event.organization_id))

    return sorted(channels)
