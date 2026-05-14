from __future__ import annotations

from dataclasses import dataclass

from app.engine.policy_engine import PolicyMatch
from app.engine.threat_detector import ThreatFinding
from app.models.enums import ThreatSeverity


@dataclass(slots=True)
class RiskAssessment:
    risk_score: int
    confidence_score: int
    severity: ThreatSeverity
    factors: list[str]


class RiskEngine:
    """Computes governance risk scores from policy/threat/agent signals."""

    _severity_weights = {
        ThreatSeverity.LOW: 20,
        ThreatSeverity.MEDIUM: 45,
        ThreatSeverity.HIGH: 70,
        ThreatSeverity.CRITICAL: 90,
    }

    def assess(
        self,
        *,
        threat_findings: list[ThreatFinding],
        policy_matches: list[PolicyMatch],
        trust_score: int,
        metadata: dict[str, object],
        gemini_threat_level: str | None = None,
    ) -> RiskAssessment:
        factors: list[str] = []

        max_threat_score = 0
        if threat_findings:
            max_threat_score = max(self._severity_weights[item.severity] for item in threat_findings)
            factors.append(f"threat_findings:{len(threat_findings)}")

        policy_score = min(35, len(policy_matches) * 12)
        if policy_matches:
            factors.append(f"policy_matches:{len(policy_matches)}")

        trust_penalty = 0
        if trust_score < 80:
            trust_penalty = min(30, (80 - trust_score) // 2)
            factors.append(f"trust_penalty:{trust_penalty}")

        metadata_score = 0
        if str(metadata.get("environment", "")).lower() == "production":
            metadata_score += 8
            factors.append("production_env")
        if str(metadata.get("source", "")).lower().find("external") >= 0:
            metadata_score += 6
            factors.append("external_source")

        gemini_score = 0
        if gemini_threat_level:
            normalized = gemini_threat_level.upper()
            gemini_score = {
                "LOW": 4,
                "MEDIUM": 10,
                "HIGH": 18,
                "CRITICAL": 25,
            }.get(normalized, 0)
            if gemini_score:
                factors.append(f"gemini_signal:{normalized}")

        raw_score = max_threat_score + policy_score + trust_penalty + metadata_score + gemini_score
        risk_score = max(0, min(100, raw_score))

        signal_count = len(threat_findings) + len(policy_matches)
        confidence = 60 + min(35, signal_count * 7)
        if gemini_threat_level:
            confidence = min(98, confidence + 5)
        confidence_score = max(50, min(99, confidence))

        if risk_score >= 85:
            severity = ThreatSeverity.CRITICAL
        elif risk_score >= 65:
            severity = ThreatSeverity.HIGH
        elif risk_score >= 40:
            severity = ThreatSeverity.MEDIUM
        else:
            severity = ThreatSeverity.LOW

        return RiskAssessment(
            risk_score=risk_score,
            confidence_score=confidence_score,
            severity=severity,
            factors=factors,
        )
