from __future__ import annotations

from uuid import UUID


class CacheKeys:
    @staticmethod
    def user_session(user_id: UUID) -> str:
        return f"user_session:{user_id}"

    @staticmethod
    def org_settings(org_id: UUID) -> str:
        return f"org_settings:{org_id}"

    @staticmethod
    def active_policies(org_id: UUID) -> str:
        return f"active_policies:{org_id}"

    @staticmethod
    def threat_summary(org_id: UUID) -> str:
        return f"threat_summary:{org_id}"

    @staticmethod
    def metrics_snapshot() -> str:
        return "metrics_snapshot:global"

    @staticmethod
    def ws_subscription(connection_id: str) -> str:
        return f"ws_subscription:{connection_id}"

    @staticmethod
    def intelligence_anomalies(org_id: UUID) -> str:
        return f"intelligence:anomalies:{org_id}"

    @staticmethod
    def intelligence_trust_history(org_id: UUID) -> str:
        return f"intelligence:trust_history:{org_id}"

    @staticmethod
    def intelligence_correlations(org_id: UUID) -> str:
        return f"intelligence:correlations:{org_id}"

    @staticmethod
    def intelligence_recommendations(org_id: UUID) -> str:
        return f"intelligence:recommendations:{org_id}"

    @staticmethod
    def intelligence_explainability(decision_id: UUID) -> str:
        return f"intelligence:explainability:{decision_id}"
