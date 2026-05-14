from datetime import datetime
from typing import Any
from uuid import UUID

from app.schemas.base import BaseEntitySchema, ORMModel, SoftDeleteSchema


class APIKeyBase(ORMModel):
    organization_id: UUID
    name: str
    permissions: dict[str, Any]
    expires_at: datetime | None = None


class APIKeyCreate(APIKeyBase):
    key_hash: str


class APIKeyUpdate(ORMModel):
    name: str | None = None
    permissions: dict[str, Any] | None = None
    expires_at: datetime | None = None


class APIKeyResponse(BaseEntitySchema, SoftDeleteSchema):
    organization_id: UUID
    name: str
    key_hash: str
    permissions: dict[str, Any]
    last_used_at: datetime | None = None
    expires_at: datetime | None = None
