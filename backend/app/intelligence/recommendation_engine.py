from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.intelligence.anomaly_detector import AnomalyResult
from app.intelligence.correlation_engine import CorrelationResult
from app.intelligence.trust_engine import TrustUpdate
from app.models.enums import GovernanceDecisionType
from app.services.gemini_service import GeminiService


@dataclass(slots=True)
class RecommendationResult:
    recommendations: list[str]
    rationale: str
    source: str


class RecommendationEngine:
    """Generates governance recommendations with optional AI enrichment."""

    def __init__(self) -> None:
        self._gemini = GeminiService()

    async def recommend(
        self,
        *,
        decision: GovernanceDecisionType,
        risk_score: int,
        anomaly: AnomalyResult,
        trust: TrustUpdate,
        correlation: CorrelationResult | None,
        context: dict[str, Any],
    ) -> RecommendationResult:
        heuristic = self._heuristic_recommendations(
            decision=decision,
            risk_score=risk_score,
            anomaly=anomaly,
            trust=trust,
            correlation=correlation,
        )

        ai_generated = await self._gemini.generate_governance_recommendations(
            context={
                "decision": decision.value,
                "risk_score": risk_score,
                "anomaly_score": anomaly.anomaly_score,
                "trust_score": trust.trust_score,
                "correlation": correlation.__dict__ if correlation else None,
                "runtime_context": context,
            }
        )
        if ai_generated:
            recommendations = list(dict.fromkeys(heuristic + ai_generated))
            return RecommendationResult(
                recommendations=recommendations[:8],
                rationale="Heuristic + Gemini governance recommendation synthesis.",
                source="hybrid",
            )

        return RecommendationResult(
            recommendations=heuristic[:8],
            rationale="Heuristic governance recommendations due to unavailable AI enrichment.",
            source="heuristic",
        )

    def _heuristic_recommendations(
        self,
        *,
        decision: GovernanceDecisionType,
        risk_score: int,
        anomaly: AnomalyResult,
        trust: TrustUpdate,
        correlation: CorrelationResult | None,
    ) -> list[str]:
        actions: list[str] = []
        if decision in {GovernanceDecisionType.BLOCK, GovernanceDecisionType.QUARANTINE}:
            actions.append("Enable mandatory human review for high-risk operations from this agent.")
        if risk_score >= 80:
            actions.append("Add strict policy guardrails for external data transfer and sensitive export operations.")
        if anomaly.is_anomalous:
            actions.append("Enable anomaly-triggered throttling and alerting for this agent workflow.")
        if trust.trust_score <= 50:
            actions.append("Reduce agent trust level and require stepped approval for privileged operations.")
        if correlation:
            actions.append("Create correlated threat suppression rule and investigate potential coordinated attack chain.")
        actions.append("Schedule policy simulation against recent blocked requests to reduce false negatives.")
        return actions
