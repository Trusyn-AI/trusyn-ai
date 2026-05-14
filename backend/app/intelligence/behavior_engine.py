from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any


@dataclass(slots=True)
class BehaviorProfile:
    agent_id: str
    request_count_last_hour: int
    blocked_count_last_hour: int
    external_interaction_count_last_hour: int
    suspicious_sequence_score: int
    drift_score: int
    indicators: list[str]


class BehaviorEngine:
    """Builds runtime behavior profiles for agents."""

    def analyze(
        self,
        *,
        agent_id: str,
        recent_activity: list[dict[str, Any]],
        current_metadata: dict[str, Any],
    ) -> BehaviorProfile:
        now = datetime.now(UTC)
        one_hour_ago = now - timedelta(hours=1)

        request_count = 0
        blocked_count = 0
        external_count = 0
        suspicious_sequence_score = 0
        drift_score = 0
        indicators: list[str] = []

        normalized_source = str(current_metadata.get("source", "")).lower()
        if "external" in normalized_source:
            external_count += 1

        for item in recent_activity:
            timestamp = item.get("timestamp")
            if isinstance(timestamp, str):
                try:
                    timestamp = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                except ValueError:
                    timestamp = None
            if isinstance(timestamp, datetime) and timestamp < one_hour_ago:
                continue

            request_count += 1
            decision = str(item.get("decision", "")).upper()
            if decision in {"BLOCK", "QUARANTINE"}:
                blocked_count += 1
            if str(item.get("source", "")).lower().find("external") >= 0:
                external_count += 1

        if blocked_count >= 3:
            suspicious_sequence_score += 25
            indicators.append("repeated_blocked_actions")
        if external_count >= 4:
            suspicious_sequence_score += 25
            indicators.append("high_external_interaction")
        if request_count >= 40:
            suspicious_sequence_score += 30
            indicators.append("request_spike")

        if recent_activity:
            avg_risk = sum(int(item.get("risk_score", 0)) for item in recent_activity[-20:]) / min(20, len(recent_activity))
            if avg_risk >= 60:
                drift_score += 25
                indicators.append("elevated_risk_baseline")
        if str(current_metadata.get("environment", "")).lower() == "production" and "external" in normalized_source:
            drift_score += 20
            indicators.append("production_external_path")

        return BehaviorProfile(
            agent_id=agent_id,
            request_count_last_hour=request_count,
            blocked_count_last_hour=blocked_count,
            external_interaction_count_last_hour=external_count,
            suspicious_sequence_score=min(100, suspicious_sequence_score),
            drift_score=min(100, drift_score),
            indicators=indicators,
        )

