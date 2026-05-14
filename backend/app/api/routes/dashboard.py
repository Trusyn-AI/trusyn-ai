from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import require_role
from app.api.deps.db import get_db_session
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.dashboard import DashboardSummaryResponse
from app.services.dashboard_service import DashboardService


router = APIRouter(prefix="/dashboard", tags=["dashboard"])
dashboard_service = DashboardService()


@router.get("/summary", response_model=SuccessResponse[DashboardSummaryResponse])
async def dashboard_summary(
    current_user: Annotated[
        User,
        Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.ANALYST, UserRole.DEVELOPER])),
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[DashboardSummaryResponse]:
    data = await dashboard_service.get_summary(session, current_user=current_user)
    return SuccessResponse(data=data, message="Dashboard summary fetched")
