from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.cache.cache_keys import CacheKeys
from app.cache.cache_service import cache_service
from app.core.exceptions import APIException
from app.models.enums import ThreatSeverity
from app.models.policy import Policy
from app.models.user import User
from app.repositories.policy_repository import PolicyRepository
from app.schemas.pagination import PaginatedResult, PaginationQuery
from app.schemas.policy import PolicyManagementCreate, PolicyUpdate
from app.services.audit_service import AuditService
from app.services.base_service import BaseService


class PolicyService(BaseService):
    def __init__(self) -> None:
        self.audit_service = AuditService()

    async def create_policy(
        self,
        session: AsyncSession,
        *,
        current_user: User,
        payload: PolicyManagementCreate,
    ) -> Policy:
        repository = PolicyRepository(session)
        organization_id = self.resolve_organization_id(current_user)

        existing = await repository.get_by_name_and_org(payload.name, organization_id)
        if existing is not None:
            raise APIException(message="Policy name already exists", error_code="policy_conflict", status_code=409)

        policy = await repository.create(
            {
                "organization_id": organization_id,
                "name": payload.name,
                "description": payload.description,
                "rule_definition": payload.rule_definition,
                "enforcement_action": payload.enforcement_action,
                "enabled": payload.enabled,
            }
        )

        await self.audit_service.create_user_action_event(
            session,
            actor=current_user,
            event_type="policy_created",
            severity=ThreatSeverity.LOW,
            message=f"Policy '{policy.name}' created",
            metadata={"policy_id": str(policy.id)},
        )
        await cache_service.delete(CacheKeys.active_policies(organization_id))
        await session.commit()
        return policy

    async def list_policies(
        self,
        session: AsyncSession,
        *,
        current_user: User,
        pagination: PaginationQuery,
        enabled: bool | None = None,
    ) -> PaginatedResult[Policy]:
        repository = PolicyRepository(session)
        filters: dict[str, Any] = {"enabled": enabled} if enabled is not None else {}
        items = await repository.list(
            current_user=current_user,
            limit=pagination.limit,
            offset=pagination.offset,
            sort_by=pagination.sort_by,
            sort_order=pagination.sort_order,
            filters=filters,
        )
        total = await repository.count(current_user=current_user, filters=filters)
        return PaginatedResult[Policy](
            items=items,
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def get_policy(self, session: AsyncSession, *, current_user: User, policy_id: UUID) -> Policy:
        repository = PolicyRepository(session)
        policy = await repository.get_by_id(policy_id, current_user=current_user)
        if policy is None:
            raise APIException(message="Policy not found", error_code="policy_not_found", status_code=404)
        return policy

    async def update_policy(
        self,
        session: AsyncSession,
        *,
        current_user: User,
        policy_id: UUID,
        payload: PolicyUpdate,
    ) -> Policy:
        repository = PolicyRepository(session)
        policy = await self.get_policy(session, current_user=current_user, policy_id=policy_id)

        updates = payload.model_dump(exclude_unset=True)
        updated = await repository.update(policy, updates)

        await self.audit_service.create_user_action_event(
            session,
            actor=current_user,
            event_type="policy_updated",
            severity=ThreatSeverity.LOW,
            message=f"Policy '{updated.name}' updated",
            metadata={"policy_id": str(updated.id), "updated_fields": list(updates.keys())},
        )
        await cache_service.delete(CacheKeys.active_policies(updated.organization_id))
        await session.commit()
        return updated

    async def delete_policy(self, session: AsyncSession, *, current_user: User, policy_id: UUID) -> None:
        repository = PolicyRepository(session)
        policy = await self.get_policy(session, current_user=current_user, policy_id=policy_id)
        await repository.soft_delete(policy)

        await self.audit_service.create_user_action_event(
            session,
            actor=current_user,
            event_type="policy_deleted",
            severity=ThreatSeverity.MEDIUM,
            message=f"Policy '{policy.name}' deleted",
            metadata={"policy_id": str(policy.id)},
        )
        await cache_service.delete(CacheKeys.active_policies(policy.organization_id))
        await session.commit()
