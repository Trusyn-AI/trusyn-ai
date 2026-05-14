from __future__ import annotations

from app.intelligence.anomaly_detector import AnomalyDetector
from app.intelligence.behavior_engine import BehaviorEngine
from app.intelligence.explainability_engine import ExplainabilityEngine
from app.intelligence.trust_engine import TrustEngine
from app.models.enums import GovernanceDecisionType


def test_behavior_and_anomaly_detection():
    behavior_engine = BehaviorEngine()
    anomaly_detector = AnomalyDetector()

    profile = behavior_engine.analyze(
        agent_id="agent-1",
        recent_activity=[
            {"decision": "BLOCK", "risk_score": 90, "source": "external", "timestamp": "2026-05-12T10:00:00+00:00"}
            for _ in range(10)
        ],
        current_metadata={"source": "external-workflow", "environment": "production"},
    )
    result = anomaly_detector.detect(profile, current_risk_score=85)
    assert result.anomaly_score >= 35
    assert result.confidence >= 65


def test_trust_and_explainability_output():
    trust_engine = TrustEngine()
    explain = ExplainabilityEngine()

    class DummyAnomaly:
        anomaly_score = 72
        anomaly_type = "behavioral_drift"
        confidence = 88
        reasoning = "repeated blocked actions"
        is_anomalous = True

    trust = trust_engine.update_trust(
        current_trust_score=80,
        anomaly=DummyAnomaly(),
        decision=GovernanceDecisionType.BLOCK,
        risk_score=82,
        policy_violation_count=2,
    )
    assert trust.trust_score < 80
    assert trust.trend == "decreasing"

    explanation = explain.explain(
        decision=GovernanceDecisionType.BLOCK,
        risk_score=82,
        threat_descriptions=["sensitive payroll export detected"],
        policy_reasons=["policy block external payroll matched"],
        anomaly=DummyAnomaly(),
        trust_update=trust,
    )
    assert "risk_score=82" in explanation.summary
    assert len(explanation.factors) >= 1

