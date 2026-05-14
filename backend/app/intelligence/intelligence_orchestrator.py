from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache.cache_keys import CacheKeys
from app.cache.cache_service import cache_service
from app.events.publishers import (
    publish_anomaly_detected,
    publish_governance_recommendation_generated,
    publish_threat_correlation_detected,
    publish_trust_score_changed,
)
from app.intelligence.anomaly_detector import AnomalyDetector, AnomalyResult
from app.intelligence.behavior_engine import BehaviorEngine
from app.intelligence.correlation_engine import CorrelationEngine, CorrelationResult
from app.intelligence.explainability_engine import ExplainabilityEngine, ExplainabilityResult
from app.intelligence.recommendation_engine import RecommendationEngine, RecommendationResult
from app.intelligence.trust_engine import TrustEngine, TrustUpdate
from app.models.ai_agent import AIAgent
from app.models.governance_decision import GovernanceDecision
from app.models.threat_event import ThreatEvent
from app.models.user import User
from app.observability.metrics import metrics_registry


@dataclass(slots=True)
class IntelligenceOutput:
    anomaly: AnomalyResult
    trust_update: TrustUpdate
    correlation: CorrelationResult | None
    explainability: ExplainabilityResult
    recommendations: RecommendationResult


class IntelligenceOrchestrator:
    """Coordinates adaptive runtime intelligence analysis and persistence."""

    def __init__(self) -> None:
        self.behavior_engine = BehaviorEngine()
        self.anomaly_detector = AnomalyDetector()
        self.trust_engine = TrustEngine()
        self.explainability_engine = ExplainabilityEngine()
        self.correlation_engine = CorrelationEngine()
        self.recommendation_engine = RecommendationEngine()

    async def run(
        self,
        session: AsyncSession,
        *,
        actor: User,
        agent: AIAgent,
        threat_event: ThreatEvent,
        governance_decision: GovernanceDecision,
        threats_detected: list[dict[str, Any]],
        matched_policies: list[dict[str, Any]],
        runtime_metadata: dict[str, Any],
        request_id: str | None,
    ) -> IntelligenceOutput:
        recent_activity = await self._load_recent_activity(session, actor.organization_id, agent.id)
        recent_threats = await self._load_recent_threats(session, actor.organization_id)

        behavior = self.behavior_engine.analyze(
            agent_id=str(agent.id),
            recent_activity=recent_activity,
            current_metadata=runtime_metadata,
        )
        anomaly = self.anomaly_detector.detect(behavior, current_risk_score=governance_decision.risk_score)
        trust = self.trust_engine.update_trust(
            current_trust_score=agent.trust_score,
            anomaly=anomaly,
            decision=governance_decision.decision,
            risk_score=governance_decision.risk_score,
            policy_violation_count=len(matched_policies),
        )

        correlation = self.correlation_engine.correlate(
            organization_id=str(actor.organization_id),
            recent_threats=recent_threats,
            current_threat_type=threat_event.threat_type,
        )

        explainability = self.explainability_engine.explain(
            decision=governance_decision.decision,
            risk_score=governance_decision.risk_score,
            threat_descriptions=[item.get("description", "") for item in threats_detected if item.get("description")],
            policy_reasons=[item.get("reason", "") for item in matched_policies if item.get("reason")],
            anomaly=anomaly,
            trust_update=trust,
        )

        recommendations = await self.recommendation_engine.recommend(
            decision=governance_decision.decision,
            risk_score=governance_decision.risk_score,
            anomaly=anomaly,
            trust=trust,
            correlation=correlation,
            context={
                "organization_id": str(actor.organization_id),
                "agent_id": str(agent.id),
                "request_id": request_id,
            },
        )

        agent.trust_score = trust.trust_score
        await session.flush()

        anomaly_record = {
            "id": str(uuid.uuid4()),
            "organization_id": str(actor.organization_id),
            "agent_id": str(agent.id),
            "anomaly_score": anomaly.anomaly_score,
            "anomaly_type": anomaly.anomaly_type,
            "confidence": anomaly.confidence,
            "reasoning": anomaly.reasoning,
            "request_id": request_id,
            "timestamp": datetime.now(UTC).isoformat(),
        }
        trust_record = {
            "id": str(uuid.uuid4()),
            "organization_id": str(actor.organization_id),
            "agent_id": str(agent.id),
            "trust_score": trust.trust_score,
            "trend": trust.trend,
            "delta": trust.delta,
            "reasoning": trust.reasoning,
            "request_id": request_id,
            "timestamp": datetime.now(UTC).isoformat(),
        }
        explainability_record = {
            "decision_id": str(governance_decision.id),
            "organization_id": str(actor.organization_id),
            "agent_id": str(agent.id),
            "summary": explainability.summary,
            "factors": explainability.factors,
            "policy_explanations": explainability.policy_explanations,
            "trust_explanations": explainability.trust_explanations,
            "timestamp": datetime.now(UTC).isoformat(),
        }
        recommendation_record = {
            "id": str(uuid.uuid4()),
            "organization_id": str(actor.organization_id),
            "agent_id": str(agent.id),
            "decision_id": str(governance_decision.id),
            "recommendations": recommendations.recommendations,
            "rationale": recommendations.rationale,
            "source": recommendations.source,
            "timestamp": datetime.now(UTC).isoformat(),
        }
        correlation_record = (
            {
                "id": str(uuid.uuid4()),
                "organization_id": str(actor.organization_id),
                "agent_id": str(agent.id),
                "decision_id": str(governance_decision.id),
                "correlation_id": correlation.correlation_id,
                "cluster_type": correlation.cluster_type,
                "confidence": correlation.confidence,
                "attack_chain": correlation.attack_chain,
                "trend": correlation.trend,
                "reasoning": correlation.reasoning,
                "timestamp": datetime.now(UTC).isoformat(),
            }
            if correlation
            else None
        )

        await self._append_history(CacheKeys.intelligence_anomalies(actor.organization_id), anomaly_record)
        await self._append_history(CacheKeys.intelligence_trust_history(actor.organization_id), trust_record)
        await self._append_history(CacheKeys.intelligence_recommendations(actor.organization_id), recommendation_record)
        await cache_service.set_json(CacheKeys.intelligence_explainability(governance_decision.id), explainability_record, ttl_seconds=86400)
        if correlation_record:
            await self._append_history(CacheKeys.intelligence_correlations(actor.organization_id), correlation_record)

        await publish_anomaly_detected(
            organization_id=actor.organization_id,
            agent_id=agent.id,
            anomaly_score=anomaly.anomaly_score,
            anomaly_type=anomaly.anomaly_type,
            confidence=anomaly.confidence,
            reasoning=anomaly.reasoning,
            request_id=request_id,
        )
        await publish_trust_score_changed(
            organization_id=actor.organization_id,
            agent_id=agent.id,
            trust_score=trust.trust_score,
            trend=trust.trend,
            delta=trust.delta,
            reasoning=trust.reasoning,
            request_id=request_id,
        )
        if correlation_record:
            await publish_threat_correlation_detected(
                organization_id=actor.organization_id,
                agent_id=agent.id,
                correlation_id=correlation.correlation_id,
                cluster_type=correlation.cluster_type,
                confidence=correlation.confidence,
                attack_chain=correlation.attack_chain,
                request_id=request_id,
            )
        await publish_governance_recommendation_generated(
            organization_id=actor.organization_id,
            agent_id=agent.id,
            recommendations=recommendations.recommendations,
            rationale=recommendations.rationale,
            source=recommendations.source,
            request_id=request_id,
        )

        await metrics_registry.increment("intelligence.anomaly.count", 1 if anomaly.is_anomalous else 0)
        await metrics_registry.increment("intelligence.trust.updates.total", 1)
        await metrics_registry.increment("intelligence.recommendations.total", len(recommendations.recommendations))
        if correlation:
            await metrics_registry.increment("intelligence.correlations.total", 1)

        return IntelligenceOutput(
            anomaly=anomaly,
            trust_update=trust,
            correlation=correlation,
            explainability=explainability,
            recommendations=recommendations,
        )

    async def _load_recent_activity(self, session: AsyncSession, organization_id: uuid.UUID, agent_id: uuid.UUID) -> list[dict[str, Any]]:
        statement = (
            select(GovernanceDecision, ThreatEvent)
            .join(ThreatEvent, ThreatEvent.id == GovernanceDecision.threat_event_id)
            .where(ThreatEvent.organization_id == organization_id, ThreatEvent.agent_id == agent_id)
            .order_by(GovernanceDecision.created_at.desc())
            .limit(60)
        )
        rows = (await session.execute(statement)).all()
        items: list[dict[str, Any]] = []
        for decision, threat in rows:
            payload = threat.raw_payload or {}
            metadata = payload.get("metadata") if isinstance(payload, dict) else {}
            items.append(
                {
                    "decision": decision.decision.value,
                    "risk_score": decision.risk_score,
                    "source": metadata.get("source") if isinstance(metadata, dict) else None,
                    "timestamp": decision.created_at.isoformat(),
                }
            )
        return items

    async def _load_recent_threats(self, session: AsyncSession, organization_id: uuid.UUID) -> list[dict[str, Any]]:
        statement = (
            select(ThreatEvent)
            .where(ThreatEvent.organization_id == organization_id)
            .order_by(ThreatEvent.detected_at.desc())
            .limit(80)
        )
        threats = (await session.scalars(statement)).all()
        return [
            {
                "threat_type": threat.threat_type,
                "severity": threat.severity.value,
                "agent_id": str(threat.agent_id) if threat.agent_id else None,
                "detected_at": threat.detected_at.isoformat(),
            }
            for threat in threats
        ]

    async def _append_history(self, cache_key: str, item: dict[str, Any], *, max_items: int = 200) -> None:
        current = await cache_service.get_json(cache_key)
        history = current if isinstance(current, list) else []
        history.append(item)
        history = history[-max_items:]
        await cache_service.set_json(cache_key, history, ttl_seconds=86400)

