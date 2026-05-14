from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import require_org_admin
from app.api.deps.db import get_db_session
from app.models.user import User
from app.schemas.api_key_management import APIKeyCreateRequest, APIKeyCreateResponse, APIKeyListItem
from app.schemas.common import SuccessResponse
from app.services.api_key_service import APIKeyService


router = APIRouter(prefix="/api-keys", tags=["api-keys"])
api_key_service = APIKeyService()


@router.get("", response_model=SuccessResponse[list[APIKeyListItem]])
async def list_api_keys(
    current_user: Annotated[User, Depends(require_org_admin)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[list[APIKeyListItem]]:
    data = await api_key_service.list_keys(session, current_user=current_user)
    return SuccessResponse(data=data, message="API keys fetched")


@router.post("", response_model=SuccessResponse[APIKeyCreateResponse], status_code=201)
async def create_api_key(
    payload: APIKeyCreateRequest,
    current_user: Annotated[User, Depends(require_org_admin)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[APIKeyCreateResponse]:
    data = await api_key_service.create_key(session, current_user=current_user, payload=payload)
    return SuccessResponse(data=data, message="API key created")


@router.delete("/{key_id}", response_model=SuccessResponse[dict[str, str]])
async def delete_api_key(
    key_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_org_admin)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[dict[str, str]]:
    await api_key_service.delete_key(session, current_user=current_user, key_id=key_id)
    return SuccessResponse(data={"status": "deleted"}, message="API key deleted")
