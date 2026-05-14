from __future__ import annotations

from dataclasses import dataclass
from time import perf_counter
from typing import Any

from loguru import logger

from app.engine.decision_engine import DecisionEngine, DecisionResult
from app.engine.policy_engine import PolicyEngine, PolicyMatch
from app.engine.risk_engine import RiskAssessment, RiskEngine
from app.engine.threat_detector import ThreatDetector, ThreatFinding
from app.models.enums import AgentStatus


@dataclass(slots=True)
class GovernanceExecutionResult:
    threats: list[ThreatFinding]
    policy_matches: list[PolicyMatch]
    risk: RiskAssessment
    decision: DecisionResult


class GovernanceEngine:
    """Runtime governance orchestration for threat/policy/risk/decision steps."""

    def __init__(self) -> None:
        self.threat_detector = ThreatDetector()
        self.policy_engine = PolicyEngine()
        self.risk_engine = RiskEngine()
        self.decision_engine = DecisionEngine()

    def execute(
        self,
        *,
        prompt: str,
        target_model: str,
        metadata: dict[str, Any],
        policies,
        agent_status: AgentStatus,
        trust_score: int,
        gemini_threat_level: str | None = None,
        request_id: str | None = None,
    ) -> GovernanceExecutionResult:
        start = perf_counter()

        detection_ctx = {"target_model": target_model, "metadata": metadata, "prompt": prompt}

        threats = self.threat_detector.detect(prompt=prompt, metadata=metadata)
        policy_matches = self.policy_engine.evaluate(context=detection_ctx, policies=policies)
        risk = self.risk_engine.assess(
            threat_findings=threats,
            policy_matches=policy_matches,
            trust_score=trust_score,
            metadata=metadata,
            gemini_threat_level=gemini_threat_level,
        )
        decision = self.decision_engine.decide(
            risk=risk,
            policy_matches=policy_matches,
            agent_status=agent_status,
        )

        duration_ms = round((perf_counter() - start) * 1000, 2)
        logger.info(
            "governance_engine_executed",
            request_id=request_id,
            target_model=target_model,
            threat_count=len(threats),
            matched_policies=len(policy_matches),
            risk_score=risk.risk_score,
            decision=decision.decision.value,
            duration_ms=duration_ms,
        )

        return GovernanceExecutionResult(
            threats=threats,
            policy_matches=policy_matches,
            risk=risk,
            decision=decision,
        )
