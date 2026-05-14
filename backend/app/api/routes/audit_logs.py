from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import require_role
from app.api.deps.db import get_db_session
from app.models.enums import ThreatSeverity, UserRole
from app.models.user import User
from app.schemas.audit_log import AuditLogResponse
from app.schemas.audit_query import AuditLogQuery
from app.schemas.common import SuccessResponse
from app.schemas.pagination import PaginatedResult
from app.services.audit_log_service import AuditLogService


router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])
audit_log_service = AuditLogService()


@router.get("", response_model=SuccessResponse[PaginatedResult[AuditLogResponse]])
async def list_audit_logs(
    current_user: Annotated[
        User,
        Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.ANALYST, UserRole.DEVELOPER])),
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
    severity: ThreatSeverity | None = None,
    event_type: str | None = None,
    user_id: uuid.UUID | None = None,
    organization_id: uuid.UUID | None = None,
    start_at: datetime | None = None,
    end_at: datetime | None = None,
    search: str | None = None,
    sort_by: str = Query("timestamp"),
    sort_order: str = Query("desc", pattern="^(asc|desc|ASC|DESC)$"),
) -> SuccessResponse[PaginatedResult[AuditLogResponse]]:
    query = AuditLogQuery(
        limit=limit,
        offset=offset,
        severity=severity,
        event_type=event_type,
        user_id=user_id,
        organization_id=organization_id,
        start_at=start_at,
        end_at=end_at,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    result = await audit_log_service.list_audit_logs(session, current_user=current_user, query=query)
    data = PaginatedResult[AuditLogResponse](
        items=[AuditLogResponse.model_validate(item) for item in result.items],
        total=result.total,
        limit=result.limit,
        offset=result.offset,
    )
    return SuccessResponse(data=data, message="Audit logs fetched")


@router.get("/{log_id}", response_model=SuccessResponse[AuditLogResponse])
async def get_audit_log(
    log_id: uuid.UUID,
    current_user: Annotated[
        User,
        Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.ANALYST, UserRole.DEVELOPER])),
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    organization_id: uuid.UUID | None = None,
) -> SuccessResponse[AuditLogResponse]:
    item = await audit_log_service.get_audit_log(
        session,
        current_user=current_user,
        audit_log_id=log_id,
        organization_id=organization_id,
    )
    return SuccessResponse(data=AuditLogResponse.model_validate(item), message="Audit log fetched")
