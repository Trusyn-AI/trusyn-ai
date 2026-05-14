from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from pydantic import field_validator

from app.models.enums import ThreatSeverity
from app.schemas.base import BaseEntitySchema, ORMModel


class ThreatEventBase(ORMModel):
    organization_id: UUID
    agent_id: UUID | None = None
    threat_type: str
    severity: ThreatSeverity = ThreatSeverity.MEDIUM
    title: str
    description: str | None = None
    raw_payload: dict[str, Any]
    source_ip: str | None = None
    detected_at: datetime | None = None


class ThreatEventCreate(ThreatEventBase):
    pass


class ThreatIngestRequest(ORMModel):
    agent_id: UUID | None = None
    threat_type: str
    severity: ThreatSeverity = ThreatSeverity.MEDIUM
    title: str
    description: str | None = None
    raw_payload: dict[str, Any]
    source_ip: str | None = None
    detected_at: datetime | None = None

    @field_validator("raw_payload")
    @classmethod
    def _validate_raw_payload(cls, value: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(value, dict):
            raise ValueError("raw_payload must be a JSON object")
        return value

    @field_validator("detected_at", mode="before")
    @classmethod
    def _default_detected_at(cls, value: datetime | None) -> datetime:
        return value or datetime.now(UTC)


class ThreatEventUpdate(ORMModel):
    severity: ThreatSeverity | None = None
    title: str | None = None
    description: str | None = None
    raw_payload: dict[str, Any] | None = None
    source_ip: str | None = None


class ThreatEventResponse(BaseEntitySchema):
    organization_id: UUID
    agent_id: UUID | None = None
    threat_type: str
    severity: ThreatSeverity
    title: str
    description: str | None = None
    raw_payload: dict[str, Any]
    source_ip: str | None = None
    detected_at: datetime
