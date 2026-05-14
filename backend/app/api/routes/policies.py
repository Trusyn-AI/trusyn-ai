from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import get_current_active_user, require_org_admin
from app.api.deps.db import get_db_session
from app.api.deps.pagination import pagination_params
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.pagination import PaginatedResult, PaginationQuery
from app.schemas.policy import PolicyManagementCreate, PolicyResponse, PolicyUpdate
from app.services.policy_service import PolicyService


router = APIRouter(prefix="/policies", tags=["policies"])
policy_service = PolicyService()


@router.post("", response_model=SuccessResponse[PolicyResponse], status_code=201)
async def create_policy(
    payload: PolicyManagementCreate,
    current_user: Annotated[User, Depends(require_org_admin)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[PolicyResponse]:
    policy = await policy_service.create_policy(session, current_user=current_user, payload=payload)
    return SuccessResponse(data=PolicyResponse.model_validate(policy), message="Policy created")


@router.get("", response_model=SuccessResponse[PaginatedResult[PolicyResponse]])
async def list_policies(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    pagination: Annotated[PaginationQuery, Depends(pagination_params)],
    enabled: bool | None = None,
) -> SuccessResponse[PaginatedResult[PolicyResponse]]:
    result = await policy_service.list_policies(
        session,
        current_user=current_user,
        pagination=pagination,
        enabled=enabled,
    )
    data = PaginatedResult[PolicyResponse](
        items=[PolicyResponse.model_validate(item) for item in result.items],
        total=result.total,
        limit=result.limit,
        offset=result.offset,
    )
    return SuccessResponse(data=data, message="Policies fetched")


@router.get("/{policy_id}", response_model=SuccessResponse[PolicyResponse])
async def get_policy(
    policy_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[PolicyResponse]:
    policy = await policy_service.get_policy(session, current_user=current_user, policy_id=policy_id)
    return SuccessResponse(data=PolicyResponse.model_validate(policy), message="Policy fetched")


@router.patch("/{policy_id}", response_model=SuccessResponse[PolicyResponse])
async def update_policy(
    policy_id: uuid.UUID,
    payload: PolicyUpdate,
    current_user: Annotated[User, Depends(require_org_admin)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[PolicyResponse]:
    policy = await policy_service.update_policy(
        session,
        current_user=current_user,
        policy_id=policy_id,
        payload=payload,
    )
    return SuccessResponse(data=PolicyResponse.model_validate(policy), message="Policy updated")


@router.delete("/{policy_id}", response_model=SuccessResponse[dict[str, str]])
async def delete_policy(
    policy_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_org_admin)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[dict[str, str]]:
    await policy_service.delete_policy(session, current_user=current_user, policy_id=policy_id)
    return SuccessResponse(data={"status": "deleted"}, message="Policy deleted")
