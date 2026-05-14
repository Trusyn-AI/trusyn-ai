from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import Field, field_validator

from app.models.enums import AgentStatus
from app.schemas.base import BaseEntitySchema, ORMModel, SoftDeleteSchema


class AIAgentBase(ORMModel):
    organization_id: UUID
    name: str
    description: str | None = None
    status: AgentStatus = AgentStatus.OPERATIONAL
    trust_score: int = Field(default=100, ge=0, le=100)
    permissions: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)
    last_active_at: datetime | None = None

    @field_validator("permissions")
    @classmethod
    def _validate_permissions(cls, value: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(value, dict):
            raise ValueError("permissions must be a JSON object")
        return value


class AIAgentCreate(AIAgentBase):
    pass


class AIAgentManagementCreate(ORMModel):
    name: str
    description: str | None = None
    status: AgentStatus = AgentStatus.OPERATIONAL
    trust_score: int = Field(default=100, ge=0, le=100)
    permissions: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("permissions")
    @classmethod
    def _validate_permissions(cls, value: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(value, dict):
            raise ValueError("permissions must be a JSON object")
        return value


class AIAgentUpdate(ORMModel):
    name: str | None = None
    description: str | None = None
    status: AgentStatus | None = None
    trust_score: int | None = Field(default=None, ge=0, le=100)
    permissions: dict[str, Any] | None = None
    metadata: dict[str, Any] | None = None
    last_active_at: datetime | None = None


class AIAgentResponse(BaseEntitySchema, SoftDeleteSchema):
    organization_id: UUID
    name: str
    description: str | None = None
    status: AgentStatus
    trust_score: int
    permissions: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict, validation_alias="metadata_json")
    last_active_at: datetime | None = None
