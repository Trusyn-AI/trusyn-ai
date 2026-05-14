from __future__ import annotations

from dataclasses import dataclass

from app.intelligence.behavior_engine import BehaviorProfile


@dataclass(slots=True)
class AnomalyResult:
    anomaly_score: int
    anomaly_type: str
    confidence: int
    reasoning: str
    is_anomalous: bool


class AnomalyDetector:
    """Heuristic + statistical-like runtime anomaly detector."""

    def detect(self, behavior: BehaviorProfile, *, current_risk_score: int) -> AnomalyResult:
        score = 0
        reasons: list[str] = []

        if behavior.request_count_last_hour >= 40:
            score += 20
            reasons.append("unusual request frequency detected")
        if behavior.blocked_count_last_hour >= 3:
            score += 25
            reasons.append("repeated blocked actions observed")
        if behavior.external_interaction_count_last_hour >= 4:
            score += 20
            reasons.append("abnormal external interaction volume")

        score += min(25, behavior.suspicious_sequence_score // 2)
        score += min(20, behavior.drift_score // 2)
        if current_risk_score >= 75:
            score += 15
            reasons.append("elevated runtime risk contributes to anomaly")

        anomaly_score = min(100, score)
        if anomaly_score >= 75:
            anomaly_type = "critical_behavioral_anomaly"
        elif anomaly_score >= 55:
            anomaly_type = "behavioral_drift"
        elif anomaly_score >= 35:
            anomaly_type = "suspicious_pattern"
        else:
            anomaly_type = "none"

        confidence = 65 + min(30, len(reasons) * 7)
        return AnomalyResult(
            anomaly_score=anomaly_score,
            anomaly_type=anomaly_type,
            confidence=min(99, confidence),
            reasoning="; ".join(reasons) if reasons else "No significant anomaly indicators found.",
            is_anomalous=anomaly_score >= 35,
        )

