from __future__ import annotations

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import require_super_admin
from app.api.deps.db import get_db_session
from app.models.enums import OrganizationStatus
from app.models.user import User
from app.schemas.admin import (
    AdminAPIRequestItem,
    AdminAPIMonitoringSummary,
    AdminOrganizationItem,
    AdminPlatformOverviewResponse,
)
from app.schemas.common import SuccessResponse
from app.schemas.pagination import PaginatedResult
from app.services.admin_service import AdminService


router = APIRouter(prefix="/admin", tags=["admin"])
admin_service = AdminService()


@router.get("/organizations", response_model=SuccessResponse[PaginatedResult[AdminOrganizationItem]])
async def list_global_organizations(
    _: Annotated[User, Depends(require_super_admin)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    limit: int = Query(25, ge=1, le=200),
    offset: int = Query(0, ge=0),
    search: str | None = None,
    status: OrganizationStatus | None = None,
    plan: str | None = None,
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc|ASC|DESC)$"),
) -> SuccessResponse[PaginatedResult[AdminOrganizationItem]]:
    data = await admin_service.list_organizations(
        session,
        limit=limit,
        offset=offset,
        search=search,
        status=status,
        plan=plan,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return SuccessResponse(data=data, message="Global organizations fetched")


@router.get("/platform-overview", response_model=SuccessResponse[AdminPlatformOverviewResponse])
async def platform_overview(
    _: Annotated[User, Depends(require_super_admin)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[AdminPlatformOverviewResponse]:
    data = await admin_service.platform_overview(session)
    return SuccessResponse(data=data, message="Admin platform overview fetched")


@router.get("/api-monitoring/summary", response_model=SuccessResponse[AdminAPIMonitoringSummary])
async def api_monitoring_summary(
    _: Annotated[User, Depends(require_super_admin)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[AdminAPIMonitoringSummary]:
    data = await admin_service.api_monitoring_summary(session)
    return SuccessResponse(data=data, message="API monitoring summary fetched")


@router.get("/api-monitoring/requests", response_model=SuccessResponse[PaginatedResult[AdminAPIRequestItem]])
async def api_monitoring_requests(
    _: Annotated[User, Depends(require_super_admin)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    limit: int = Query(50, ge=1, le=300),
    offset: int = Query(0, ge=0),
    organization_id: UUID | None = None,
    model: str | None = None,
    status: str | None = Query(default=None, pattern="^(success|blocked|failed)$"),
    start_at: datetime | None = None,
    end_at: datetime | None = None,
) -> SuccessResponse[PaginatedResult[AdminAPIRequestItem]]:
    data = await admin_service.api_monitoring_requests(
        session,
        limit=limit,
        offset=offset,
        organization_id=organization_id,
        model=model,
        status=status,
        start_at=start_at,
        end_at=end_at,
    )
    return SuccessResponse(data=data, message="API monitoring requests fetched")

