from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.settings import IntegrationConfigRecord, IntegrationConfigUpdate
from app.services.settings_service import SettingsService


class IntegrationService:
    """Dedicated integration facade kept separate from profile settings workflows."""

    def __init__(self) -> None:
        self._settings_service = SettingsService()

    async def list_integrations(self, session: AsyncSession, *, current_user: User) -> list[IntegrationConfigRecord]:
        return await self._settings_service.list_integrations(session, current_user=current_user)

    async def update_integration(
        self,
        session: AsyncSession,
        *,
        current_user: User,
        integration_key: str,
        payload: IntegrationConfigUpdate,
    ) -> IntegrationConfigRecord:
        return await self._settings_service.update_integration(
            session,
            current_user=current_user,
            integration_key=integration_key,
            payload=payload,
        )
