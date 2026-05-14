from __future__ import annotations

from pydantic import Field

from app.schemas.base import ORMModel
from app.schemas.user import UserResponse


class UpdateCurrentUserRequest(ORMModel):
    full_name: str | None = None
    avatar_url: str | None = None
    preferences: dict[str, object] | None = None
    current_password: str | None = None
    new_password: str | None = None


class CurrentUserProfileResponse(ORMModel):
    user: UserResponse


class IntegrationConfigRecord(ORMModel):
    key: str
    enabled: bool
    config: dict[str, object] = Field(default_factory=dict)


class IntegrationConfigUpdate(ORMModel):
    enabled: bool
    config: dict[str, object] = Field(default_factory=dict)
