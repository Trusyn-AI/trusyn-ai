from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import APIException
from app.core.security import hash_password, verify_password
from app.models.enums import ThreatSeverity
from app.models.user import User
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.user_repository import UserRepository
from app.schemas.settings import IntegrationConfigRecord, IntegrationConfigUpdate, UpdateCurrentUserRequest
from app.services.audit_service import AuditService


class SettingsService:
    def __init__(self) -> None:
        self.audit_service = AuditService()

    async def update_current_user(
        self,
        session: AsyncSession,
        *,
        current_user: User,
        payload: UpdateCurrentUserRequest,
    ) -> User:
        if payload.new_password is not None:
            if not payload.current_password:
                raise APIException(
                    message="current_password is required when changing password",
                    error_code="current_password_required",
                    status_code=422,
                )
            if not verify_password(payload.current_password, current_user.password_hash):
                raise APIException(
                    message="Current password is invalid",
                    error_code="invalid_current_password",
                    status_code=400,
                )
            if len(payload.new_password) < 8:
                raise APIException(
                    message="New password must be at least 8 characters",
                    error_code="weak_password",
                    status_code=422,
                )
            current_user.password_hash = hash_password(payload.new_password)

        if payload.full_name is not None:
            current_user.full_name = payload.full_name
        if payload.avatar_url is not None:
            current_user.avatar_url = payload.avatar_url
        if payload.preferences is not None:
            current_user.preferences_json = payload.preferences

        await self.audit_service.create_user_action_event(
            session,
            actor=current_user,
            event_type="user_profile_updated",
            severity=ThreatSeverity.LOW,
            message=f"User '{current_user.email}' updated profile settings",
            metadata={
                "updated_fields": [
                    key
                    for key, value in payload.model_dump(exclude_unset=True).items()
                    if value is not None and key not in {"current_password", "new_password"}
                ]
            },
        )
        await session.commit()
        await session.refresh(current_user)
        return current_user

    async def list_integrations(self, session: AsyncSession, *, current_user: User) -> list[IntegrationConfigRecord]:
        org_repo = OrganizationRepository(session)
        organization = await org_repo.get_by_id_active(current_user.organization_id)
        if organization is None:
            raise APIException(message="Organization not found", error_code="organization_not_found", status_code=404)

        integrations = organization.settings_json.get("integrations", {}) if isinstance(organization.settings_json, dict) else {}
        if not isinstance(integrations, dict):
            integrations = {}

        items: list[IntegrationConfigRecord] = []
        for key, value in integrations.items():
            if not isinstance(value, dict):
                continue
            items.append(
                IntegrationConfigRecord(
                    key=key,
                    enabled=bool(value.get("enabled", False)),
                    config=value.get("config", {}) if isinstance(value.get("config", {}), dict) else {},
                )
            )

        return sorted(items, key=lambda item: item.key)

    async def update_integration(
        self,
        session: AsyncSession,
        *,
        current_user: User,
        integration_key: str,
        payload: IntegrationConfigUpdate,
    ) -> IntegrationConfigRecord:
        normalized_key = integration_key.strip().lower().replace(" ", "_")
        if not normalized_key:
            raise APIException(message="Invalid integration key", error_code="invalid_integration_key", status_code=422)

        org_repo = OrganizationRepository(session)
        organization = await org_repo.get_by_id_active(current_user.organization_id)
        if organization is None:
            raise APIException(message="Organization not found", error_code="organization_not_found", status_code=404)

        settings = organization.settings_json if isinstance(organization.settings_json, dict) else {}
        integrations = settings.get("integrations", {}) if isinstance(settings.get("integrations", {}), dict) else {}
        integrations[normalized_key] = {
            "enabled": payload.enabled,
            "config": payload.config,
        }
        settings["integrations"] = integrations
        organization.settings_json = settings

        await self.audit_service.create_user_action_event(
            session,
            actor=current_user,
            event_type="integration_updated",
            severity=ThreatSeverity.LOW,
            message=f"Integration '{normalized_key}' updated",
            metadata={"integration_key": normalized_key, "enabled": payload.enabled},
        )
        await session.commit()

        return IntegrationConfigRecord(key=normalized_key, enabled=payload.enabled, config=payload.config)
