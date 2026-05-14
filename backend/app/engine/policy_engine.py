from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from app.models.enums import GovernanceDecisionType
from app.models.policy import Policy


@dataclass(slots=True)
class PolicyMatch:
    policy_id: str
    policy_name: str
    enforcement_action: GovernanceDecisionType
    reason: str


class PolicyEngine:
    """Evaluates tenant policies against runtime request context."""

    def evaluate(self, *, context: dict[str, Any], policies: list[Policy | dict[str, Any]]) -> list[PolicyMatch]:
        matches: list[PolicyMatch] = []

        for policy in policies:
            enabled = _policy_attr(policy, "enabled", False)
            if not enabled:
                continue

            rule = _policy_attr(policy, "rule_definition", {}) or {}
            conditions = rule.get("conditions", [])
            match_mode = str(rule.get("match", "all")).lower()

            condition_results: list[bool] = []
            for condition in conditions:
                condition_results.append(self._evaluate_condition(context, condition))

            is_match = all(condition_results) if match_mode == "all" else any(condition_results)
            if conditions and is_match:
                action = _policy_attr(policy, "enforcement_action", GovernanceDecisionType.REVIEW)
                if isinstance(action, str):
                    action = GovernanceDecisionType(action)
                matches.append(
                    PolicyMatch(
                        policy_id=str(_policy_attr(policy, "id", "")),
                        policy_name=str(_policy_attr(policy, "name", "Unnamed Policy")),
                        enforcement_action=action,
                        reason=f"Matched {len([item for item in condition_results if item])} condition(s)",
                    )
                )

        return matches

    def _evaluate_condition(self, context: dict[str, Any], condition: dict[str, Any]) -> bool:
        field_path = condition.get("field")
        op = str(condition.get("op", "eq")).lower()
        expected = condition.get("value")
        actual = self._resolve_field(context, field_path)

        if op == "eq":
            return actual == expected
        if op == "neq":
            return actual != expected
        if op == "contains":
            return str(expected).lower() in str(actual).lower()
        if op == "in":
            return actual in expected if isinstance(expected, list) else False
        if op == "starts_with":
            return str(actual).lower().startswith(str(expected).lower())
        if op == "ends_with":
            return str(actual).lower().endswith(str(expected).lower())
        if op == "regex":
            return bool(re.search(str(expected), str(actual), re.IGNORECASE))
        if op == "exists":
            return actual is not None
        if op == "gt":
            try:
                return float(actual) > float(expected)
            except (TypeError, ValueError):
                return False
        if op == "lt":
            try:
                return float(actual) < float(expected)
            except (TypeError, ValueError):
                return False
        return False

    def _resolve_field(self, context: dict[str, Any], field_path: str | None) -> Any:
        if not field_path:
            return None
        cursor: Any = context
        for part in field_path.split("."):
            if isinstance(cursor, dict) and part in cursor:
                cursor = cursor[part]
            else:
                return None
        return cursor


def _policy_attr(policy: Policy | dict[str, Any], field: str, default: Any) -> Any:
    if isinstance(policy, dict):
        return policy.get(field, default)
    return getattr(policy, field, default)

