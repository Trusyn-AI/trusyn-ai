from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import require_org_admin
from app.api.deps.db import get_db_session
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.settings import IntegrationConfigRecord, IntegrationConfigUpdate
from app.services.integration_service import IntegrationService


router = APIRouter(prefix="/integrations", tags=["integrations"])
integration_service = IntegrationService()


@router.get("", response_model=SuccessResponse[list[IntegrationConfigRecord]])
async def list_integrations(
    current_user: Annotated[User, Depends(require_org_admin)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[list[IntegrationConfigRecord]]:
    items = await integration_service.list_integrations(session, current_user=current_user)
    return SuccessResponse(data=items, message="Integrations fetched")


@router.patch("/{integration_key}", response_model=SuccessResponse[IntegrationConfigRecord])
async def update_integration(
    integration_key: str,
    payload: IntegrationConfigUpdate,
    current_user: Annotated[User, Depends(require_org_admin)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[IntegrationConfigRecord]:
    item = await integration_service.update_integration(
        session,
        current_user=current_user,
        integration_key=integration_key,
        payload=payload,
    )
    return SuccessResponse(data=item, message="Integration updated")
