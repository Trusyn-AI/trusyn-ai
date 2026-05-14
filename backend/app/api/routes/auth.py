from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import get_current_active_user, user_permissions
from app.api.deps.db import get_db_session
from app.core.exceptions import APIException
from app.models.organization import Organization
from app.models.user import User
from app.schemas.auth import (
    CurrentUserResponse,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.common import SuccessResponse
from app.schemas.organization import OrganizationResponse
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService


router = APIRouter(prefix="/auth", tags=["auth"])
auth_service = AuthService()


@router.post("/register", response_model=SuccessResponse[TokenResponse], status_code=201)
async def register_organization_admin(
    payload: RegisterRequest,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[TokenResponse]:
    token_bundle = await auth_service.register_organization_admin(session, payload)
    return SuccessResponse(data=token_bundle, message="Organization and admin registered")


@router.post("/login", response_model=SuccessResponse[TokenResponse])
async def login(
    payload: LoginRequest,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[TokenResponse]:
    token_bundle = await auth_service.authenticate_user(session, payload)
    return SuccessResponse(data=token_bundle, message="Authenticated successfully")


@router.post("/refresh", response_model=SuccessResponse[TokenResponse])
async def refresh_access_token(
    payload: RefreshTokenRequest,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[TokenResponse]:
    token_bundle = await auth_service.refresh_access_token(session, payload.refresh_token)
    return SuccessResponse(data=token_bundle, message="Token refreshed successfully")


@router.get("/me", response_model=SuccessResponse[CurrentUserResponse])
async def get_me(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[CurrentUserResponse]:
    organization = await session.get(Organization, current_user.organization_id)
    if organization is None:
        raise APIException(
            message="Organization not found",
            error_code="organization_not_found",
            status_code=404,
        )
    response = CurrentUserResponse(
        user=UserResponse.model_validate(current_user),
        organization=OrganizationResponse.model_validate(organization),
        role=current_user.role.value,
        permissions=user_permissions(current_user),
    )
    return SuccessResponse(data=response, message="Current user profile")
