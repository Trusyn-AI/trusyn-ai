from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import APIException
from app.events.publishers import publish_agent_status_changed
from app.models.ai_agent import AIAgent
from app.models.enums import AgentStatus, ThreatSeverity, UserRole
from app.models.user import User
from app.repositories.ai_agent_repository import AIAgentRepository
from app.schemas.ai_agent import AIAgentManagementCreate, AIAgentUpdate
from app.schemas.pagination import PaginatedResult, PaginationQuery
from app.services.audit_service import AuditService
from app.services.base_service import BaseService


class AIAgentService(BaseService):
    def __init__(self) -> None:
        self.audit_service = AuditService()

    async def create_agent(
        self,
        session: AsyncSession,
        *,
        current_user: User,
        payload: AIAgentManagementCreate,
    ) -> AIAgent:
        repository = AIAgentRepository(session)
        organization_id = self.resolve_organization_id(current_user)

        existing = await repository.get_by_name_and_org(payload.name, organization_id)
        if existing is not None:
            raise APIException(message="Agent name already exists", error_code="agent_conflict", status_code=409)

        agent = await repository.create(
            {
                "organization_id": organization_id,
                "name": payload.name,
                "description": payload.description,
                "status": payload.status,
                "trust_score": payload.trust_score,
                "permissions": payload.permissions,
                "metadata_json": payload.metadata,
            }
        )

        await self.audit_service.create_user_action_event(
            session,
            actor=current_user,
            event_type="agent_created",
            severity=ThreatSeverity.LOW,
            message=f"Agent '{agent.name}' created",
            metadata={"agent_id": str(agent.id), "status": agent.status.value},
        )
        await session.commit()
        return agent

    async def list_agents(
        self,
        session: AsyncSession,
        *,
        current_user: User,
        pagination: PaginationQuery,
        status: AgentStatus | None = None,
    ) -> PaginatedResult[AIAgent]:
        repository = AIAgentRepository(session)
        filters: dict[str, Any] = {"status": status} if status else {}
        items = await repository.list(
            current_user=current_user,
            limit=pagination.limit,
            offset=pagination.offset,
            sort_by=pagination.sort_by,
            sort_order=pagination.sort_order,
            filters=filters,
        )
        total = await repository.count(current_user=current_user, filters=filters)
        return PaginatedResult[AIAgent](
            items=items,
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def get_agent(self, session: AsyncSession, *, current_user: User, agent_id: UUID) -> AIAgent:
        repository = AIAgentRepository(session)
        agent = await repository.get_by_id(agent_id, current_user=current_user)
        if agent is None:
            raise APIException(message="Agent not found", error_code="agent_not_found", status_code=404)
        return agent

    async def update_agent(
        self,
        session: AsyncSession,
        *,
        current_user: User,
        agent_id: UUID,
        payload: AIAgentUpdate,
    ) -> AIAgent:
        repository = AIAgentRepository(session)
        agent = await self.get_agent(session, current_user=current_user, agent_id=agent_id)

        previous_status = agent.status
        updates = payload.model_dump(exclude_unset=True)
        if "metadata" in updates:
            updates["metadata_json"] = updates.pop("metadata")

        updated = await repository.update(agent, updates)
        await self.audit_service.create_user_action_event(
            session,
            actor=current_user,
            event_type="agent_updated",
            severity=ThreatSeverity.LOW,
            message=f"Agent '{updated.name}' updated",
            metadata={"agent_id": str(updated.id), "updated_fields": list(updates.keys())},
        )
        if "status" in updates and updated.status != previous_status:
            await publish_agent_status_changed(
                organization_id=updated.organization_id,
                actor_user_id=current_user.id,
                agent_id=updated.id,
                old_status=previous_status.value,
                new_status=updated.status.value,
            )
        await session.commit()
        return updated

    async def delete_agent(self, session: AsyncSession, *, current_user: User, agent_id: UUID) -> None:
        if current_user.role not in {UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN}:
            raise APIException(message="Insufficient permissions", error_code="forbidden", status_code=403)

        repository = AIAgentRepository(session)
        agent = await self.get_agent(session, current_user=current_user, agent_id=agent_id)
        previous_status = agent.status
        agent.status = AgentStatus.BLOCKED
        await repository.soft_delete(agent)

        await self.audit_service.create_user_action_event(
            session,
            actor=current_user,
            event_type="agent_deleted",
            severity=ThreatSeverity.MEDIUM,
            message=f"Agent '{agent.name}' deactivated",
            metadata={"agent_id": str(agent.id)},
        )
        await publish_agent_status_changed(
            organization_id=agent.organization_id,
            actor_user_id=current_user.id,
            agent_id=agent.id,
            old_status=previous_status.value,
            new_status=AgentStatus.BLOCKED.value,
        )
        await session.commit()
