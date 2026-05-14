from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import Field

from app.models.enums import ThreatSeverity
from app.schemas.base import BaseEntitySchema, ORMModel


class AuditLogBase(ORMModel):
    organization_id: UUID
    user_id: UUID | None = None
    event_type: str
    severity: ThreatSeverity = ThreatSeverity.LOW
    message: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime | None = None


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogUpdate(ORMModel):
    message: str | None = None
    metadata: dict[str, Any] | None = None
    severity: ThreatSeverity | None = None


class AuditLogResponse(BaseEntitySchema):
    organization_id: UUID
    user_id: UUID | None = None
    event_type: str
    severity: ThreatSeverity
    message: str
    metadata: dict[str, Any] = Field(default_factory=dict, validation_alias="metadata_json")
    timestamp: datetime
