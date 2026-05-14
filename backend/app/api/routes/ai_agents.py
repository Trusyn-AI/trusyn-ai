from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import get_current_active_user, require_org_admin, require_role
from app.api.deps.db import get_db_session
from app.api.deps.pagination import pagination_params
from app.models.enums import AgentStatus, UserRole
from app.models.user import User
from app.schemas.ai_agent import AIAgentManagementCreate, AIAgentResponse, AIAgentUpdate
from app.schemas.common import SuccessResponse
from app.schemas.pagination import PaginatedResult, PaginationQuery
from app.services.ai_agent_service import AIAgentService


router = APIRouter(prefix="/agents", tags=["ai-agents"])
agent_service = AIAgentService()


@router.post("", response_model=SuccessResponse[AIAgentResponse], status_code=201)
async def create_agent(
    payload: AIAgentManagementCreate,
    current_user: Annotated[
        User,
        Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.DEVELOPER])),
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[AIAgentResponse]:
    agent = await agent_service.create_agent(session, current_user=current_user, payload=payload)
    return SuccessResponse(data=AIAgentResponse.model_validate(agent), message="Agent created")


@router.get("", response_model=SuccessResponse[PaginatedResult[AIAgentResponse]])
async def list_agents(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    pagination: Annotated[PaginationQuery, Depends(pagination_params)],
    status: AgentStatus | None = None,
) -> SuccessResponse[PaginatedResult[AIAgentResponse]]:
    result = await agent_service.list_agents(
        session,
        current_user=current_user,
        pagination=pagination,
        status=status,
    )
    data = PaginatedResult[AIAgentResponse](
        items=[AIAgentResponse.model_validate(item) for item in result.items],
        total=result.total,
        limit=result.limit,
        offset=result.offset,
    )
    return SuccessResponse(data=data, message="Agents fetched")


@router.get("/{agent_id}", response_model=SuccessResponse[AIAgentResponse])
async def get_agent(
    agent_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[AIAgentResponse]:
    agent = await agent_service.get_agent(session, current_user=current_user, agent_id=agent_id)
    return SuccessResponse(data=AIAgentResponse.model_validate(agent), message="Agent fetched")


@router.patch("/{agent_id}", response_model=SuccessResponse[AIAgentResponse])
async def update_agent(
    agent_id: uuid.UUID,
    payload: AIAgentUpdate,
    current_user: Annotated[
        User,
        Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.DEVELOPER])),
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[AIAgentResponse]:
    agent = await agent_service.update_agent(
        session,
        current_user=current_user,
        agent_id=agent_id,
        payload=payload,
    )
    return SuccessResponse(data=AIAgentResponse.model_validate(agent), message="Agent updated")


@router.delete("/{agent_id}", response_model=SuccessResponse[dict[str, str]])
async def delete_agent(
    agent_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_org_admin)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SuccessResponse[dict[str, str]]:
    await agent_service.delete_agent(session, current_user=current_user, agent_id=agent_id)
    return SuccessResponse(data={"status": "deleted"}, message="Agent deleted")
