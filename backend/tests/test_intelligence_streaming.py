from __future__ import annotations

import uuid

from app.events.event_models import AnomalyDetectedEvent, ThreatSeverity
from app.ws.channels import INTELLIGENCE_GLOBAL_CHANNEL, channels_for_event, intelligence_channel_for_org


def test_intelligence_event_channel_mapping():
    org_id = uuid.uuid4()
    event = AnomalyDetectedEvent(
        organization_id=org_id,
        agent_id=uuid.uuid4(),
        severity=ThreatSeverity.HIGH,
        channel=intelligence_channel_for_org(org_id),
        payload={"anomaly_score": 77},
    )
    channels = channels_for_event(event)
    assert INTELLIGENCE_GLOBAL_CHANNEL in channels
    assert intelligence_channel_for_org(org_id) in channels

