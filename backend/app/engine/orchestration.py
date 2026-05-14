from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache.cache_keys import CacheKeys
from app.cache.cache_service import cache_service
from app.core.config import settings
from app.core.exceptions import APIException
from app.engine.governance_engine import GovernanceEngine
from app.events.publishers import (
    publish_gateway_request_received,
    publish_governance_decision_created,
    publish_policy_violation,
    publish_risk_score_updated,
    publish_threat_detected,
)
from app.intelligence.intelligence_orchestrator import IntelligenceOrchestrator
from app.models.enums import ThreatSeverity, UserRole
from app.models.governance_decision import GovernanceDecision
from app.models.threat_event import ThreatEvent
from app.models.user import User
from app.observability.telemetry import telemetry_service
from app.observability.tracing import get_trace_context, start_span_async
from app.repositories.ai_agent_repository import AIAgentRepository
from app.repositories.governance_decision_repository import GovernanceDecisionRepository
from app.repositories.policy_repository import PolicyRepository
from app.repositories.threat_event_repository import ThreatEventRepository
from app.services.alert_service import alert_service
from app.services.audit_service import AuditService
from app.services.gemini_service import GeminiAnalysisResult, GeminiService


@dataclass(slots=True)
class GovernancePipelineOutput:
    threat_event: ThreatEvent
    governance_decision: GovernanceDecision
    threats_detected: list[dict[str, Any]]
    matched_policies: list[dict[str, Any]]
    decision_message: str
    gemini_analysis: GeminiAnalysisResult | None


class GovernanceOrchestrator:
    """Coordinates runtime gateway flow into persisted governance artifacts."""

    SUPPORTED_MODELS = {"gemini-pro", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash", "gemini-2.5-flash"}

    def __init__(self) -> None:
        self.governance_engine = GovernanceEngine()
        self.audit_service = AuditService()
        self.gemini_service = GeminiService()
        self.intelligence_orchestrator = IntelligenceOrchestrator()

    async def process_runtime_request(
        self,
        session: AsyncSession,
        *,
        current_user: User,
        agent_id: uuid.UUID,
        target_model: str,
        prompt: str,
        metadata: dict[str, Any],
        request_id: str | None,
    ) -> GovernancePipelineOutput:
        trace_context = get_trace_context()
        if trace_context is not None:
            trace_context.organization_id = str(current_user.organization_id)
            trace_context.actor_user_id = str(current_user.id)
            trace_context.agent_id = str(agent_id)

        if not prompt or not prompt.strip():
            raise APIException(message="Prompt cannot be empty", error_code="invalid_prompt", status_code=400)

        if target_model not in self.SUPPORTED_MODELS:
            raise APIException(
                message="Unsupported target model",
                error_code="unsupported_model",
                status_code=400,
                details={"supported_models": sorted(self.SUPPORTED_MODELS)},
            )

        agent_repo = AIAgentRepository(session)
        agent = await agent_repo.get_by_id(agent_id, current_user=current_user)
        if agent is None:
            raise APIException(message="Agent not found", error_code="agent_not_found", status_code=404)

        if current_user.role != UserRole.SUPER_ADMIN and current_user.organization_id != agent.organization_id:
            raise APIException(message="Cross-tenant access is forbidden", error_code="tenant_forbidden", status_code=403)

        policy_repo = PolicyRepository(session)
        policies_cache_key = CacheKeys.active_policies(agent.organization_id)
        async with start_span_async("governance.load_active_policies"):
            cached_policies = await cache_service.get_json(policies_cache_key)
            if isinstance(cached_policies, list):
                policies = cached_policies
            else:
                policies = await policy_repo.list(
                    current_user=current_user,
                    organization_id=agent.organization_id,
                    filters={"enabled": True},
                    limit=500,
                    sort_by="created_at",
                    sort_order="asc",
                )
                await cache_service.set_json(
                    policies_cache_key,
                    [
                        {
                            "id": str(policy.id),
                            "name": policy.name,
                            "enabled": policy.enabled,
                            "rule_definition": policy.rule_definition,
                            "enforcement_action": policy.enforcement_action.value,
                        }
                        for policy in policies
                    ],
                    ttl_seconds=settings.redis_default_ttl_seconds,
                )

        await self.audit_service.create_user_action_event(
            session,
            actor=current_user,
            event_type="gateway_request_received",
            severity=ThreatSeverity.LOW,
            message=f"Gateway request received for agent '{agent.name}'",
            metadata={"agent_id": str(agent.id), "target_model": target_model, "request_id": request_id},
        )
        await publish_gateway_request_received(
            organization_id=agent.organization_id,
            actor_user_id=current_user.id,
            agent_id=agent.id,
            target_model=target_model,
            request_id=request_id,
        )

        async with start_span_async("governance.gemini_analysis"):
            gemini_analysis = await self.gemini_service.analyze_request(
                prompt=prompt,
                target_model=target_model,
                metadata=metadata,
                request_id=request_id,
            )

        async with start_span_async("governance.execution"):
            execution = self.governance_engine.execute(
                prompt=prompt,
                target_model=target_model,
                metadata=metadata,
                policies=policies,
                agent_status=agent.status,
                trust_score=agent.trust_score,
                gemini_threat_level=gemini_analysis.threat_level if gemini_analysis else None,
                request_id=request_id,
            )
        await telemetry_service.record_policy_matches(count=len(execution.policy_matches))
        await telemetry_service.record_decision(decision=execution.decision.decision)
        await publish_risk_score_updated(
            organization_id=agent.organization_id,
            agent_id=agent.id,
            risk_score=execution.risk.risk_score,
            confidence_score=execution.risk.confidence_score,
            severity=execution.risk.severity,
            factors=execution.risk.factors,
            request_id=request_id,
        )

        primary_threat = execution.threats[0] if execution.threats else None
        for finding in execution.threats:
            await publish_threat_detected(
                organization_id=agent.organization_id,
                agent_id=agent.id,
                severity=finding.severity,
                threat_type=finding.threat_type,
                title=finding.title,
                description=finding.description,
                indicators=finding.indicators,
                request_id=request_id,
            )
            await telemetry_service.record_threat_detected(severity=finding.severity)

        for match in execution.policy_matches:
            await publish_policy_violation(
                organization_id=agent.organization_id,
                agent_id=agent.id,
                policy_id=match.policy_id,
                policy_name=match.policy_name,
                enforcement_action=match.enforcement_action,
                reason=match.reason,
                request_id=request_id,
            )

        threat_repo = ThreatEventRepository(session)
        threat_event = await threat_repo.create(
            {
                "organization_id": agent.organization_id,
                "agent_id": agent.id,
                "threat_type": primary_threat.threat_type if primary_threat else "governance_evaluation",
                "severity": execution.risk.severity,
                "title": primary_threat.title if primary_threat else "Governance evaluation",
                "description": primary_threat.description if primary_threat else execution.decision.reason,
                "raw_payload": {
                    "prompt": prompt,
                    "target_model": target_model,
                    "metadata": metadata,
                    "threat_indicators": [f.indicators for f in execution.threats],
                    "matched_policy_ids": [p.policy_id for p in execution.policy_matches],
                    "request_id": request_id,
                },
                "source_ip": str(metadata.get("source_ip")) if metadata.get("source_ip") else None,
                "detected_at": datetime.now(UTC),
            }
        )

        governance_repo = GovernanceDecisionRepository(session)
        governance_decision = await governance_repo.create(
            {
                "threat_event_id": threat_event.id,
                "decision": execution.decision.decision,
                "reason": execution.decision.reason,
                "risk_score": execution.risk.risk_score,
                "confidence_score": execution.risk.confidence_score,
            }
        )

        final_severity = execution.risk.severity
        await self.audit_service.create_user_action_event(
            session,
            actor=current_user,
            event_type="governance_decision_created",
            severity=final_severity,
            message=execution.decision.message,
            metadata={
                "request_id": request_id,
                "agent_id": str(agent.id),
                "threat_event_id": str(threat_event.id),
                "governance_decision_id": str(governance_decision.id),
                "decision": execution.decision.decision.value,
                "risk_score": execution.risk.risk_score,
                "confidence_score": execution.risk.confidence_score,
            },
        )
        await publish_governance_decision_created(
            organization_id=agent.organization_id,
            actor_user_id=current_user.id,
            agent_id=agent.id,
            decision=execution.decision.decision,
            risk_score=execution.risk.risk_score,
            confidence_score=execution.risk.confidence_score,
            reason=execution.decision.reason,
            request_id=request_id,
            threat_event_id=threat_event.id,
            governance_decision_id=governance_decision.id,
        )
        await alert_service.publish_governance_alert(
            decision=execution.decision.decision,
            risk_score=execution.risk.risk_score,
            metadata={
                "organization_id": str(agent.organization_id),
                "agent_id": str(agent.id),
                "request_id": request_id,
                "threat_event_id": str(threat_event.id),
                "governance_decision_id": str(governance_decision.id),
            },
        )

        threats_detected = [
            {
                "threat_type": finding.threat_type,
                "severity": finding.severity,
                "title": finding.title,
                "description": finding.description,
                "indicators": finding.indicators,
                "confidence": finding.confidence,
            }
            for finding in execution.threats
        ]

        matched_policies = [
            {
                "policy_id": match.policy_id,
                "policy_name": match.policy_name,
                "enforcement_action": match.enforcement_action,
                "reason": match.reason,
            }
            for match in execution.policy_matches
        ]

        await self.intelligence_orchestrator.run(
            session,
            actor=current_user,
            agent=agent,
            threat_event=threat_event,
            governance_decision=governance_decision,
            threats_detected=threats_detected,
            matched_policies=matched_policies,
            runtime_metadata=metadata,
            request_id=request_id,
        )

        await session.commit()
        logger.info(
            "governance_pipeline_persisted",
            request_id=request_id,
            organization_id=str(agent.organization_id),
            agent_id=str(agent.id),
            threat_event_id=str(threat_event.id),
            governance_decision_id=str(governance_decision.id),
            final_decision=governance_decision.decision.value,
        )

        return GovernancePipelineOutput(
            threat_event=threat_event,
            governance_decision=governance_decision,
            threats_detected=threats_detected,
            matched_policies=matched_policies,
            decision_message=execution.decision.message,
            gemini_analysis=gemini_analysis,
        )
