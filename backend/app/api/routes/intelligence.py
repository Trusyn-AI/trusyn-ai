from __future__ import annotations

import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query

from app.api.deps.auth import get_current_active_user
from app.cache.cache_keys import CacheKeys
from app.cache.cache_service import cache_service
from app.core.exceptions import APIException
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.intelligence import (
    IntelligenceCollectionResponse,
    IntelligenceExplainabilityRecord,
)


router = APIRouter(prefix="/intelligence", tags=["intelligence"])


def _resolve_org_id(current_user: User, organization_id: str | None) -> uuid.UUID:
    if current_user.role == UserRole.SUPER_ADMIN and organization_id:
        try:
            return uuid.UUID(organization_id)
        except ValueError as exc:
            raise APIException(message="Invalid organization_id", error_code="invalid_organization_id", status_code=400) from exc
    return current_user.organization_id


async def _read_collection(cache_key: str, limit: int) -> IntelligenceCollectionResponse:
    raw = await cache_service.get_json(cache_key)
    items = raw if isinstance(raw, list) else []
    sliced = items[-limit:]
    return IntelligenceCollectionResponse(items=sliced, total=len(items))


@router.get("/anomalies", response_model=SuccessResponse[IntelligenceCollectionResponse])
async def list_anomalies(
    current_user: Annotated[User, Depends(get_current_active_user)],
    organization_id: str | None = None,
    limit: int = Query(50, ge=1, le=500),
) -> SuccessResponse[IntelligenceCollectionResponse]:
    org_id = _resolve_org_id(current_user, organization_id)
    data = await _read_collection(CacheKeys.intelligence_anomalies(org_id), limit)
    return SuccessResponse(data=data, message="Intelligence anomalies fetched")


@router.get("/trust-scores", response_model=SuccessResponse[IntelligenceCollectionResponse])
async def list_trust_scores(
    current_user: Annotated[User, Depends(get_current_active_user)],
    organization_id: str | None = None,
    limit: int = Query(50, ge=1, le=500),
) -> SuccessResponse[IntelligenceCollectionResponse]:
    org_id = _resolve_org_id(current_user, organization_id)
    history = await _read_collection(CacheKeys.intelligence_trust_history(org_id), 500)
    latest_by_agent: dict[str, dict[str, Any]] = {}
    for item in history.items:
        agent_id = str(item.get("agent_id", ""))
        latest_by_agent[agent_id] = item
    items = list(latest_by_agent.values())[-limit:]
    data = IntelligenceCollectionResponse(items=items, total=len(items))
    return SuccessResponse(data=data, message="Intelligence trust scores fetched")


@router.get("/correlations", response_model=SuccessResponse[IntelligenceCollectionResponse])
async def list_correlations(
    current_user: Annotated[User, Depends(get_current_active_user)],
    organization_id: str | None = None,
    limit: int = Query(50, ge=1, le=500),
) -> SuccessResponse[IntelligenceCollectionResponse]:
    org_id = _resolve_org_id(current_user, organization_id)
    data = await _read_collection(CacheKeys.intelligence_correlations(org_id), limit)
    return SuccessResponse(data=data, message="Intelligence correlations fetched")


@router.get("/recommendations", response_model=SuccessResponse[IntelligenceCollectionResponse])
async def list_recommendations(
    current_user: Annotated[User, Depends(get_current_active_user)],
    organization_id: str | None = None,
    limit: int = Query(50, ge=1, le=500),
) -> SuccessResponse[IntelligenceCollectionResponse]:
    org_id = _resolve_org_id(current_user, organization_id)
    data = await _read_collection(CacheKeys.intelligence_recommendations(org_id), limit)
    return SuccessResponse(data=data, message="Governance recommendations fetched")


@router.get("/explainability/{decision_id}", response_model=SuccessResponse[IntelligenceExplainabilityRecord])
async def get_explainability(
    decision_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> SuccessResponse[IntelligenceExplainabilityRecord]:
    raw = await cache_service.get_json(CacheKeys.intelligence_explainability(decision_id))
    if not isinstance(raw, dict):
        raise APIException(message="Explainability record not found", error_code="explainability_not_found", status_code=404)

    org_id = raw.get("organization_id")
    if current_user.role != UserRole.SUPER_ADMIN and str(current_user.organization_id) != str(org_id):
        raise APIException(message="Cross-tenant access is forbidden", error_code="tenant_forbidden", status_code=403)

    data = IntelligenceExplainabilityRecord.model_validate(raw)
    return SuccessResponse(data=data, message="Explainability record fetched")

