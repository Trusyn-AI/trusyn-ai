from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import get_current_active_user, require_role
from app.api.deps.db import get_db_session
from app.api.deps.pagination import pagination_params
from app.models.enums import ThreatSeverity, UserRole
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.pagination import PaginatedResult, PaginationQuery
from app.schemas.threat_event import ThreatEventResponse, ThreatIngestRequest
from app.schemas.threat_investigation import ThreatInvestigationResponse
from app.services.threat_service import ThreatService
from app.services.threat_investigation_service import ThreatInvestigationService


router = APIRouter(prefix="/threats", tags=["threats"])
threat_service = ThreatService()
threat_investigation_service = ThreatInvestigationService()


@router.post("/ingest", response_model=SuccessResponse[ThreatEventResponse], status_code=201)
async def ingest_threat(
    payload: ThreatIngestRequest,
    current_user: Annotated[
        User,
        Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.DEVELOPER])),
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[ThreatEventResponse]:
    threat = await threat_service.ingest_threat(session, current_user=current_user, payload=payload)
    return SuccessResponse(data=ThreatEventResponse.model_validate(threat), message="Threat ingested")


@router.get("", response_model=SuccessResponse[PaginatedResult[ThreatEventResponse]])
async def list_threats(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    pagination: Annotated[PaginationQuery, Depends(pagination_params)],
    severity: ThreatSeverity | None = None,
) -> SuccessResponse[PaginatedResult[ThreatEventResponse]]:
    result = await threat_service.list_threats(
        session,
        current_user=current_user,
        pagination=pagination,
        severity=severity,
    )
    data = PaginatedResult[ThreatEventResponse](
        items=[ThreatEventResponse.model_validate(item) for item in result.items],
        total=result.total,
        limit=result.limit,
        offset=result.offset,
    )
    return SuccessResponse(data=data, message="Threats fetched")


@router.get("/{threat_id}", response_model=SuccessResponse[ThreatEventResponse])
async def get_threat(
    threat_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[ThreatEventResponse]:
    threat = await threat_service.get_threat(session, current_user=current_user, threat_id=threat_id)
    return SuccessResponse(data=ThreatEventResponse.model_validate(threat), message="Threat fetched")


@router.get("/{threat_id}/investigation", response_model=SuccessResponse[ThreatInvestigationResponse])
async def get_threat_investigation(
    threat_id: uuid.UUID,
    current_user: Annotated[
        User,
        Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.ANALYST])),
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[ThreatInvestigationResponse]:
    data = await threat_investigation_service.get_investigation(
        session,
        current_user=current_user,
        threat_id=threat_id,
    )
    return SuccessResponse(data=data, message="Threat investigation fetched")
