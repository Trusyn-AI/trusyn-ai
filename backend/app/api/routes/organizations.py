from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import get_current_active_user, require_org_admin
from app.api.deps.db import get_db_session
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.organization import OrganizationResponse, OrganizationUpdate
from app.services.organization_service import OrganizationService


router = APIRouter(prefix="/organizations", tags=["organizations"])
organization_service = OrganizationService()


@router.get("/current", response_model=SuccessResponse[OrganizationResponse])
async def get_current_organization(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[OrganizationResponse]:
    organization = await organization_service.get_current_organization(session, current_user)
    return SuccessResponse(data=OrganizationResponse.model_validate(organization), message="Organization profile")


@router.patch("/current", response_model=SuccessResponse[OrganizationResponse])
async def update_current_organization(
    payload: OrganizationUpdate,
    current_user: Annotated[User, Depends(require_org_admin)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[OrganizationResponse]:
    organization = await organization_service.update_current_organization(session, current_user, payload)
    return SuccessResponse(data=OrganizationResponse.model_validate(organization), message="Organization updated")
