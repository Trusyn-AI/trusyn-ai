from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import get_current_active_user, require_org_admin
from app.api.deps.db import get_db_session
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.settings import UpdateCurrentUserRequest
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.settings_service import SettingsService
from app.services.user_service import UserService


router = APIRouter(prefix="/users", tags=["users"])
user_service = UserService()
settings_service = SettingsService()


@router.get("/me", response_model=SuccessResponse[UserResponse])
async def get_my_user(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> SuccessResponse[UserResponse]:
    return SuccessResponse(data=UserResponse.model_validate(current_user), message="Current user")


@router.patch("/me", response_model=SuccessResponse[UserResponse])
async def update_my_user(
    payload: UpdateCurrentUserRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[UserResponse]:
    user = await settings_service.update_current_user(session, current_user=current_user, payload=payload)
    return SuccessResponse(data=UserResponse.model_validate(user), message="Profile updated")


@router.get("", response_model=SuccessResponse[list[UserResponse]])
async def list_users(
    current_user: Annotated[User, Depends(require_org_admin)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[list[UserResponse]]:
    users = await user_service.list_users(session, current_user)
    return SuccessResponse(data=[UserResponse.model_validate(item) for item in users], message="Users fetched")


@router.post("", response_model=SuccessResponse[UserResponse], status_code=201)
async def create_user(
    payload: UserCreate,
    current_user: Annotated[User, Depends(require_org_admin)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[UserResponse]:
    user = await user_service.create_user(session, current_user, payload)
    return SuccessResponse(data=UserResponse.model_validate(user), message="User created")


@router.patch("/{user_id}", response_model=SuccessResponse[UserResponse])
async def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    current_user: Annotated[User, Depends(require_org_admin)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[UserResponse]:
    user = await user_service.update_user(session, current_user, user_id, payload)
    return SuccessResponse(data=UserResponse.model_validate(user), message="User updated")


@router.delete("/{user_id}", response_model=SuccessResponse[dict[str, str]])
async def delete_user(
    user_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_org_admin)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[dict[str, str]]:
    await user_service.delete_user(session, current_user, user_id)
    return SuccessResponse(data={"status": "deleted"}, message="User deleted")
