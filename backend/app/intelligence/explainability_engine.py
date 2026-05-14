from __future__ import annotations

from dataclasses import dataclass

from app.intelligence.anomaly_detector import AnomalyResult
from app.intelligence.trust_engine import TrustUpdate
from app.models.enums import GovernanceDecisionType


@dataclass(slots=True)
class ExplainabilityResult:
    summary: str
    factors: list[str]
    policy_explanations: list[str]
    trust_explanations: list[str]


class ExplainabilityEngine:
    """Generates human-readable governance intelligence explanations."""

    def explain(
        self,
        *,
        decision: GovernanceDecisionType,
        risk_score: int,
        threat_descriptions: list[str],
        policy_reasons: list[str],
        anomaly: AnomalyResult,
        trust_update: TrustUpdate,
    ) -> ExplainabilityResult:
        decision_text = decision.value.lower()
        summary = f"Request {decision_text}ed due to runtime governance risk assessment (risk_score={risk_score})."
        factors = list(threat_descriptions[:4])
        if anomaly.is_anomalous:
            factors.append(f"Behavioral anomaly detected: {anomaly.reasoning}")
        if not factors:
            factors.append("No significant threat indicators were detected.")

        policy_explanations = policy_reasons or ["No policy violations were matched."]
        trust_explanations = [
            f"Trust score updated to {trust_update.trust_score} ({trust_update.trend}).",
            *trust_update.reasoning[:4],
        ]

        return ExplainabilityResult(
            summary=summary,
            factors=factors,
            policy_explanations=policy_explanations,
            trust_explanations=trust_explanations,
        )

