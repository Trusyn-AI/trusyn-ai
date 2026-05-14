from __future__ import annotations

from dataclasses import dataclass

from app.intelligence.anomaly_detector import AnomalyResult
from app.models.enums import GovernanceDecisionType


@dataclass(slots=True)
class TrustUpdate:
    trust_score: int
    trend: str
    reasoning: list[str]
    delta: int


class TrustEngine:
    """Adaptive trust scoring engine driven by runtime behavior."""

    def update_trust(
        self,
        *,
        current_trust_score: int,
        anomaly: AnomalyResult,
        decision: GovernanceDecisionType,
        risk_score: int,
        policy_violation_count: int,
    ) -> TrustUpdate:
        delta = 0
        reasons: list[str] = []

        if decision in {GovernanceDecisionType.BLOCK, GovernanceDecisionType.QUARANTINE}:
            delta -= 10
            reasons.append("high-impact governance action reduced trust")
        elif decision == GovernanceDecisionType.ALLOW and risk_score < 35:
            delta += 4
            reasons.append("consistent low-risk behavior improved trust")

        if anomaly.is_anomalous:
            penalty = max(4, anomaly.anomaly_score // 10)
            delta -= penalty
            reasons.append("behavioral anomaly detected")

        if policy_violation_count > 0:
            delta -= min(12, policy_violation_count * 2)
            reasons.append("policy violation pressure lowered trust")

        if risk_score >= 80:
            delta -= 8
            reasons.append("critical risk score lowered trust")
        elif risk_score <= 25:
            delta += 2
            reasons.append("low-risk execution slightly improved trust")

        updated_score = max(0, min(100, current_trust_score + delta))
        if delta > 1:
            trend = "increasing"
        elif delta < -1:
            trend = "decreasing"
        else:
            trend = "stable"

        return TrustUpdate(
            trust_score=updated_score,
            trend=trend,
            reasoning=reasons or ["trust score remained stable"],
            delta=delta,
        )

