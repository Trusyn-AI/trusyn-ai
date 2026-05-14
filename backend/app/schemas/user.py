from datetime import datetime
from uuid import UUID

from pydantic import AliasChoices, Field

from app.models.enums import UserRole
from app.schemas.base import BaseEntitySchema, ORMModel, SoftDeleteSchema


class UserBase(ORMModel):
    organization_id: UUID
    email: str
    full_name: str
    role: UserRole = UserRole.DEVELOPER
    is_active: bool = True
    avatar_url: str | None = None
    preferences: dict[str, object] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("preferences", "preferences_json"),
    )


class UserCreate(UserBase):
    password: str


class UserUpdate(ORMModel):
    full_name: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None
    password: str | None = None
    last_login_at: datetime | None = None
    avatar_url: str | None = None
    preferences: dict[str, object] | None = None


class UserResponse(UserBase, BaseEntitySchema, SoftDeleteSchema):
    last_login_at: datetime | None = None
