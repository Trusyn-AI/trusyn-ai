from __future__ import annotations

import uuid
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache.cache_keys import CacheKeys
from app.cache.cache_service import cache_service
from app.core.exceptions import APIException
from app.models.policy import Policy
from app.models.user import User
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.governance_decision_repository import GovernanceDecisionRepository
from app.repositories.threat_event_repository import ThreatEventRepository
from app.schemas.threat_investigation import (
    InvestigationDecision,
    InvestigationPolicyReference,
    InvestigationTimelineEntry,
    RelatedThreat,
    ThreatInvestigationResponse,
)
from app.services.base_service import BaseService


class ThreatInvestigationService(BaseService):
    async def get_investigation(
        self,
        session: AsyncSession,
        *,
        current_user: User,
        threat_id: uuid.UUID,
    ) -> ThreatInvestigationResponse:
        threat_repo = ThreatEventRepository(session)
        threat = await threat_repo.get_by_id(threat_id, current_user=current_user)
        if threat is None:
            raise APIException(message="Threat not found", error_code="threat_not_found", status_code=404)

        decision_repo = GovernanceDecisionRepository(session)
        decisions = await decision_repo.list_for_threat(threat_event_id=threat.id)

        matched_policy_ids_raw = threat.raw_payload.get("matched_policy_ids", []) if isinstance(threat.raw_payload, dict) else []
        policy_ids: list[uuid.UUID] = []
        for item in matched_policy_ids_raw:
            try:
                policy_ids.append(uuid.UUID(str(item)))
            except (ValueError, TypeError):
                continue

        policies: list[Policy] = []
        if policy_ids:
            policy_stmt = select(Policy).where(
                Policy.organization_id == threat.organization_id,
                Policy.id.in_(policy_ids),
                Policy.is_deleted.is_(False),
            )
            policies = list((await session.scalars(policy_stmt)).all())

        start_at = threat.detected_at - timedelta(minutes=10)
        end_anchor = decisions[-1].created_at if decisions else threat.detected_at
        end_at = end_anchor + timedelta(minutes=10)

        audit_repo = AuditLogRepository(session)
        timeline_logs = await audit_repo.timeline_for_threat(
            current_user=current_user,
            organization_id=threat.organization_id,
            start_at=start_at,
            end_at=end_at,
            limit=40,
        )

        related = await threat_repo.related_threats(
            organization_id=threat.organization_id,
            threat_type=threat.threat_type,
            agent_id=threat.agent_id,
            detected_at=threat.detected_at,
            exclude_threat_id=threat.id,
            limit=8,
        )

        explainability_summary: str | None = None
        for decision in decisions:
            explainability = await cache_service.get_json(CacheKeys.intelligence_explainability(decision.id))
            if isinstance(explainability, dict):
                explainability_summary = str(explainability.get("summary") or explainability.get("reasoning") or "")
                if explainability_summary:
                    break

        if not explainability_summary and decisions and decisions[0].reason:
            explainability_summary = decisions[0].reason

        policy_map = {str(policy.id): policy.name for policy in policies}
        risk_reasoning_summary = "No high-confidence governance rationale available."
        if decisions:
            top = max(decisions, key=lambda item: item.risk_score)
            policy_context = ""
            if policy_map:
                policy_context = f" Policies matched: {', '.join(policy_map.values())}."
            risk_reasoning_summary = (
                f"Highest recorded risk score is {top.risk_score} with decision {top.decision.value}."
                f"{policy_context}"
            )

        return ThreatInvestigationResponse(
            threat_id=threat.id,
            organization_id=threat.organization_id,
            agent_id=threat.agent_id,
            threat_type=threat.threat_type,
            severity=threat.severity,
            title=threat.title,
            description=threat.description,
            detected_at=threat.detected_at,
            source_ip=threat.source_ip,
            raw_payload=threat.raw_payload,
            decisions=[
                InvestigationDecision(
                    governance_decision_id=decision.id,
                    decision=decision.decision,
                    risk_score=decision.risk_score,
                    confidence_score=decision.confidence_score,
                    reason=decision.reason,
                    created_at=decision.created_at,
                )
                for decision in decisions
            ],
            matched_policies=[
                InvestigationPolicyReference(
                    policy_id=policy.id,
                    name=policy.name,
                    enforcement_action=policy.enforcement_action,
                )
                for policy in policies
            ],
            risk_reasoning_summary=risk_reasoning_summary,
            timeline=[
                InvestigationTimelineEntry(
                    event_type=entry.event_type,
                    timestamp=entry.timestamp,
                    severity=entry.severity,
                    message=entry.message,
                )
                for entry in timeline_logs
            ],
            related_threats=[
                RelatedThreat(
                    threat_id=item.id,
                    threat_type=item.threat_type,
                    severity=item.severity,
                    title=item.title,
                    detected_at=item.detected_at,
                )
                for item in related
            ],
            explainability_summary=explainability_summary,
        )
