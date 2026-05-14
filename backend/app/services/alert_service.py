from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from app.models.enums import GovernanceDecisionType, ThreatSeverity


@dataclass(slots=True)
class AlertRecord:
    alert_type: str
    severity: ThreatSeverity
    title: str
    message: str
    metadata: dict[str, Any]
    timestamp: datetime


class AlertService:
    """Internal alert pipeline prepared for external channels in future phases."""

    def __init__(self) -> None:
        self._recent_alerts: deque[AlertRecord] = deque(maxlen=300)

    async def publish_critical_threat_alert(
        self,
        *,
        title: str,
        message: str,
        metadata: dict[str, Any],
        severity: ThreatSeverity = ThreatSeverity.CRITICAL,
    ) -> None:
        self._recent_alerts.append(
            AlertRecord(
                alert_type="critical_threat",
                severity=severity,
                title=title,
                message=message,
                metadata=metadata,
                timestamp=datetime.now(UTC),
            )
        )

    async def publish_governance_alert(
        self,
        *,
        decision: GovernanceDecisionType,
        risk_score: int,
        metadata: dict[str, Any],
    ) -> None:
        if decision not in {GovernanceDecisionType.BLOCK, GovernanceDecisionType.QUARANTINE, GovernanceDecisionType.REVIEW}:
            return
        severity = ThreatSeverity.HIGH if decision == GovernanceDecisionType.REVIEW else ThreatSeverity.CRITICAL
        self._recent_alerts.append(
            AlertRecord(
                alert_type="governance_high_risk",
                severity=severity,
                title=f"Governance decision {decision.value}",
                message=f"High-risk governance decision generated (risk_score={risk_score})",
                metadata=metadata,
                timestamp=datetime.now(UTC),
            )
        )

    def recent_alerts(self, limit: int = 50) -> list[dict[str, Any]]:
        return [
            {
                "alert_type": alert.alert_type,
                "severity": alert.severity.value,
                "title": alert.title,
                "message": alert.message,
                "metadata": alert.metadata,
                "timestamp": alert.timestamp.isoformat(),
            }
            for alert in list(self._recent_alerts)[-limit:]
        ]


alert_service = AlertService()

