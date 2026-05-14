from __future__ import annotations

import hashlib
import secrets
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import APIException
from app.models.api_key import APIKey
from app.models.enums import ThreatSeverity
from app.models.user import User
from app.schemas.api_key_management import APIKeyCreateRequest, APIKeyCreateResponse, APIKeyListItem
from app.services.audit_service import AuditService


class APIKeyService:
    def __init__(self) -> None:
        self.audit_service = AuditService()

    def _hash_api_key(self, value: str) -> str:
        return hashlib.sha256(f"{settings.secret_key}:{value}".encode("utf-8")).hexdigest()

    async def list_keys(self, session: AsyncSession, *, current_user: User) -> list[APIKeyListItem]:
        statement = (
            select(APIKey)
            .where(
                APIKey.organization_id == current_user.organization_id,
                APIKey.is_deleted.is_(False),
            )
            .order_by(APIKey.created_at.desc())
        )
        rows = (await session.scalars(statement)).all()
        return [
            APIKeyListItem(
                id=item.id,
                organization_id=item.organization_id,
                created_at=item.created_at,
                updated_at=item.updated_at,
                name=item.name,
                permissions=item.permissions,
                last_used_at=item.last_used_at,
                expires_at=item.expires_at,
            )
            for item in rows
        ]

    async def create_key(
        self,
        session: AsyncSession,
        *,
        current_user: User,
        payload: APIKeyCreateRequest,
    ) -> APIKeyCreateResponse:
        token = f"trusyn_{secrets.token_urlsafe(32)}"
        key_hash = self._hash_api_key(token)

        existing = await session.scalar(select(APIKey).where(APIKey.key_hash == key_hash, APIKey.is_deleted.is_(False)))
        if existing is not None:
            raise APIException(message="Key collision detected, retry creation", error_code="key_conflict", status_code=409)

        item = APIKey(
            organization_id=current_user.organization_id,
            name=payload.name,
            key_hash=key_hash,
            permissions=payload.permissions,
            expires_at=payload.expires_at,
        )
        session.add(item)

        await self.audit_service.create_user_action_event(
            session,
            actor=current_user,
            event_type="api_key_created",
            severity=ThreatSeverity.LOW,
            message=f"API key '{payload.name}' created",
            metadata={"api_key_id": str(item.id), "name": payload.name},
        )
        await session.commit()
        await session.refresh(item)

        return APIKeyCreateResponse(
            id=item.id,
            name=item.name,
            key=token,
            permissions=item.permissions,
            expires_at=item.expires_at,
            created_at=item.created_at,
        )

    async def delete_key(self, session: AsyncSession, *, current_user: User, key_id: uuid.UUID) -> None:
        item = await session.scalar(
            select(APIKey).where(
                APIKey.id == key_id,
                APIKey.organization_id == current_user.organization_id,
                APIKey.is_deleted.is_(False),
            )
        )
        if item is None:
            raise APIException(message="API key not found", error_code="api_key_not_found", status_code=404)

        item.is_deleted = True

        await self.audit_service.create_user_action_event(
            session,
            actor=current_user,
            event_type="api_key_deleted",
            severity=ThreatSeverity.MEDIUM,
            message=f"API key '{item.name}' deleted",
            metadata={"api_key_id": str(item.id)},
        )
        await session.commit()
