from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import Field

from app.schemas.base import BaseEntitySchema, ORMModel


class APIKeyCreateRequest(ORMModel):
    name: str
    permissions: dict[str, Any] = Field(default_factory=dict)
    expires_at: datetime | None = None


class APIKeyCreateResponse(ORMModel):
    id: UUID
    name: str
    key: str
    permissions: dict[str, Any]
    expires_at: datetime | None = None
    created_at: datetime


class APIKeyListItem(BaseEntitySchema):
    organization_id: UUID
    name: str
    permissions: dict[str, Any]
    last_used_at: datetime | None = None
    expires_at: datetime | None = None


class APIKeyListResponse(ORMModel):
    items: list[APIKeyListItem]
