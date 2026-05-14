from __future__ import annotations

import re
from dataclasses import dataclass

from app.models.enums import ThreatSeverity


@dataclass(slots=True)
class ThreatFinding:
    threat_type: str
    severity: ThreatSeverity
    title: str
    description: str
    indicators: list[str]
    confidence: int


class ThreatDetector:
    """Hybrid rule + heuristic threat detector for runtime governance."""

    _PATTERN_LIBRARY: dict[str, tuple[ThreatSeverity, list[str]]] = {
        "prompt_injection": (
            ThreatSeverity.HIGH,
            [
                r"ignore\s+previous\s+instructions",
                r"bypass\s+security",
                r"override\s+policy",
                r"forget\s+all\s+rules",
            ],
        ),
        "data_exfiltration": (
            ThreatSeverity.CRITICAL,
            [
                r"export\s+payroll\s+externally",
                r"send\s+.*\s+to\s+external",
                r"dump\s+database",
                r"exfiltrat",
            ],
        ),
        "credential_exposure": (
            ThreatSeverity.CRITICAL,
            [
                r"reveal\s+credentials",
                r"show\s+api\s+keys?",
                r"print\s+secrets?",
                r"private\s+key",
            ],
        ),
        "suspicious_api_access": (
            ThreatSeverity.MEDIUM,
            [
                r"curl\s+http",
                r"wget\s+http",
                r"undocumented\s+endpoint",
                r"admin\s+api",
            ],
        ),
    }

    def detect(self, *, prompt: str, metadata: dict[str, object]) -> list[ThreatFinding]:
        normalized_prompt = prompt.lower().strip()
        findings: list[ThreatFinding] = []

        for threat_type, (severity, patterns) in self._PATTERN_LIBRARY.items():
            matched = [pattern for pattern in patterns if re.search(pattern, normalized_prompt)]
            if matched:
                findings.append(
                    ThreatFinding(
                        threat_type=threat_type,
                        severity=severity,
                        title=threat_type.replace("_", " ").title(),
                        description=f"Detected pattern(s) for {threat_type}",
                        indicators=matched,
                        confidence=min(95, 65 + len(matched) * 10),
                    )
                )

        # Heuristic signal: outbound URL operations in production contexts.
        environment = str(metadata.get("environment", "")).lower()
        if ("http://" in normalized_prompt or "https://" in normalized_prompt) and environment == "production":
            findings.append(
                ThreatFinding(
                    threat_type="anomalous_behavior",
                    severity=ThreatSeverity.HIGH,
                    title="Anomalous Production Network Intent",
                    description="Prompt references external network calls in production environment",
                    indicators=["external-network-intent", "production-environment"],
                    confidence=72,
                )
            )

        return findings
