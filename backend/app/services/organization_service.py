from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import enforce_tenant_access
from app.cache.cache_keys import CacheKeys
from app.cache.cache_service import cache_service
from app.core.exceptions import APIException
from app.models.enums import ThreatSeverity
from app.models.organization import Organization
from app.models.user import User
from app.schemas.organization import OrganizationUpdate
from app.services.audit_service import AuditService


class OrganizationService:
    def __init__(self) -> None:
        self.audit_service = AuditService()

    async def get_current_organization(self, session: AsyncSession, current_user: User) -> Organization:
        cache_key = CacheKeys.org_settings(current_user.organization_id)
        organization = await session.scalar(
            select(Organization).where(
                Organization.id == current_user.organization_id,
                Organization.is_deleted.is_(False),
            )
        )
        if organization is None:
            raise APIException(
                message="Organization not found",
                error_code="organization_not_found",
                status_code=404,
            )
        await cache_service.set_json(
            cache_key,
            {
                "name": organization.name,
                "slug": organization.slug,
                "description": organization.description,
                "plan": organization.plan,
                "status": organization.status.value,
                "website": organization.website,
                "settings": organization.settings_json,
            },
        )
        return organization

    async def update_current_organization(
        self,
        session: AsyncSession,
        current_user: User,
        payload: OrganizationUpdate,
    ) -> Organization:
        organization = await self.get_current_organization(session, current_user)
        enforce_tenant_access(current_user, organization.id)

        if payload.name is not None:
            organization.name = payload.name
        if payload.slug is not None:
            organization.slug = payload.slug
        if payload.description is not None:
            organization.description = payload.description
        if payload.plan is not None:
            organization.plan = payload.plan
        if payload.status is not None:
            organization.status = payload.status
        if payload.website is not None:
            organization.website = payload.website
        if payload.settings is not None:
            organization.settings_json = payload.settings

        await self.audit_service.create_user_action_event(
            session,
            actor=current_user,
            event_type="organization_updated",
            severity=ThreatSeverity.LOW,
            message=f"Organization '{organization.slug}' updated",
            metadata={"organization_id": str(organization.id)},
        )
        await cache_service.delete(CacheKeys.org_settings(organization.id))

        try:
            await session.commit()
        except IntegrityError as exc:
            await session.rollback()
            raise APIException(
                message="Unable to update organization",
                error_code="organization_update_failed",
                status_code=400,
            ) from exc
        await session.refresh(organization)
        return organization
