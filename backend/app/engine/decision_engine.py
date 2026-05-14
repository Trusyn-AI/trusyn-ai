from __future__ import annotations

from dataclasses import dataclass

from app.engine.policy_engine import PolicyMatch
from app.engine.risk_engine import RiskAssessment
from app.models.enums import AgentStatus, GovernanceDecisionType


@dataclass(slots=True)
class DecisionResult:
    decision: GovernanceDecisionType
    reason: str
    message: str


class DecisionEngine:
    """Converts risk and policy outputs into runtime governance actions."""

    _policy_precedence: dict[GovernanceDecisionType, int] = {
        GovernanceDecisionType.BLOCK: 5,
        GovernanceDecisionType.QUARANTINE: 4,
        GovernanceDecisionType.RATE_LIMIT: 3,
        GovernanceDecisionType.REVIEW: 2,
        GovernanceDecisionType.ALLOW: 1,
    }

    def decide(
        self,
        *,
        risk: RiskAssessment,
        policy_matches: list[PolicyMatch],
        agent_status: AgentStatus,
    ) -> DecisionResult:
        if agent_status == AgentStatus.BLOCKED:
            return DecisionResult(
                decision=GovernanceDecisionType.BLOCK,
                reason="Agent is already blocked",
                message="Request blocked because agent status is BLOCKED.",
            )

        if agent_status == AgentStatus.QUARANTINED:
            return DecisionResult(
                decision=GovernanceDecisionType.QUARANTINE,
                reason="Agent is currently quarantined",
                message="Request quarantined pending manual review.",
            )

        if policy_matches:
            strongest = max(policy_matches, key=lambda p: self._policy_precedence[p.enforcement_action])
            return DecisionResult(
                decision=strongest.enforcement_action,
                reason=f"Policy matched: {strongest.policy_name}",
                message=f"Request governed by policy '{strongest.policy_name}'.",
            )

        if risk.risk_score >= 85:
            return DecisionResult(
                decision=GovernanceDecisionType.BLOCK,
                reason="Critical runtime risk",
                message="Request blocked by governance engine.",
            )
        if risk.risk_score >= 65:
            return DecisionResult(
                decision=GovernanceDecisionType.REVIEW,
                reason="High runtime risk",
                message="Request sent for human review.",
            )
        if risk.risk_score >= 45:
            return DecisionResult(
                decision=GovernanceDecisionType.RATE_LIMIT,
                reason="Elevated risk requiring throttling",
                message="Request rate-limited by governance engine.",
            )

        return DecisionResult(
            decision=GovernanceDecisionType.ALLOW,
            reason="Risk within acceptable threshold",
            message="Request allowed by governance engine.",
        )
