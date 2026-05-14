from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(slots=True)
class CorrelationResult:
    correlation_id: str
    cluster_type: str
    confidence: int
    attack_chain: list[str]
    trend: str
    reasoning: str


class CorrelationEngine:
    """Correlates threat events into attack clusters and trends."""

    def correlate(
        self,
        *,
        organization_id: str,
        recent_threats: list[dict[str, Any]],
        current_threat_type: str,
    ) -> CorrelationResult | None:
        if not recent_threats:
            return None

        same_type = [item for item in recent_threats if str(item.get("threat_type", "")).lower() == current_threat_type.lower()]
        prompt_injection_count = len([item for item in recent_threats if "prompt" in str(item.get("threat_type", "")).lower()])
        exfiltration_count = len([item for item in recent_threats if "exfiltration" in str(item.get("threat_type", "")).lower()])

        if len(same_type) < 3 and (prompt_injection_count + exfiltration_count) < 5:
            return None

        chain: list[str] = []
        if prompt_injection_count >= 2:
            chain.append("prompt_injection_sequence")
        if exfiltration_count >= 2:
            chain.append("data_exfiltration_sequence")
        if len(same_type) >= 3:
            chain.append(f"repeated_{current_threat_type}")

        cluster_type = "coordinated_attack_pattern" if len(chain) >= 2 else "repeated_threat_cluster"
        confidence = min(95, 60 + len(chain) * 12 + len(same_type) * 3)
        trend = "increasing" if len(recent_threats) >= 8 else "stable"

        return CorrelationResult(
            correlation_id=f"{organization_id}:{current_threat_type}:{len(recent_threats)}",
            cluster_type=cluster_type,
            confidence=confidence,
            attack_chain=chain,
            trend=trend,
            reasoning=f"Detected {len(same_type)} recurring '{current_threat_type}' threats with chain={chain}.",
        )

