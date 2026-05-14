from __future__ import annotations

from time import perf_counter
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import require_role
from app.api.deps.db import get_db_session
from app.engine.orchestration import GovernanceOrchestrator
from app.models.enums import UserRole
from app.models.user import User
from app.observability.telemetry import telemetry_service
from app.schemas.common import SuccessResponse
from app.schemas.gateway import GatewayDecisionData, GatewayRequest, PolicyMatchItem, ThreatDetectionItem


router = APIRouter(prefix="/gateway", tags=["gateway"])
orchestrator = GovernanceOrchestrator()


@router.post("/request", response_model=SuccessResponse[GatewayDecisionData])
async def gateway_request(
    payload: GatewayRequest,
    request: Request,
    current_user: Annotated[
        User,
        Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.DEVELOPER])),
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[GatewayDecisionData]:
    start = perf_counter()
    request_id = getattr(request.state, "request_id", None)
    metadata = dict(payload.metadata)
    if request.client and request.client.host and "source_ip" not in metadata:
        metadata["source_ip"] = request.client.host

    result = await orchestrator.process_runtime_request(
        session,
        current_user=current_user,
        agent_id=payload.agent_id,
        target_model=payload.target_model,
        prompt=payload.prompt,
        metadata=metadata,
        request_id=request_id,
    )

    response_data = GatewayDecisionData(
        decision=result.governance_decision.decision,
        risk_score=result.governance_decision.risk_score,
        confidence_score=result.governance_decision.confidence_score,
        threats_detected=[ThreatDetectionItem.model_validate(item) for item in result.threats_detected],
        matched_policies=[PolicyMatchItem.model_validate(item) for item in result.matched_policies],
        message=result.decision_message,
        threat_event_id=result.threat_event.id,
        governance_decision_id=result.governance_decision.id,
        gemini_recommendation=result.gemini_analysis.recommendation if result.gemini_analysis else None,
        gemini_reasoning=result.gemini_analysis.reasoning if result.gemini_analysis else None,
    )
    await telemetry_service.record_gateway_latency(duration_ms=round((perf_counter() - start) * 1000, 3))

    return SuccessResponse(data=response_data, message=result.decision_message)

