from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.models.enums import ThreatSeverity
from app.schemas.audit_log import AuditLogResponse
from app.schemas.base import ORMModel
from app.schemas.pagination import PaginatedResult


class AuditLogSortField(str):
    TIMESTAMP = "timestamp"
    SEVERITY = "severity"
    EVENT_TYPE = "event_type"


class AuditLogQuery(ORMModel):
    limit: int = Field(default=20, ge=1, le=200)
    offset: int = Field(default=0, ge=0)
    severity: ThreatSeverity | None = None
    event_type: str | None = None
    user_id: UUID | None = None
    organization_id: UUID | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    search: str | None = None
    sort_by: str = Field(default="timestamp")
    sort_order: str = Field(default="desc", pattern="^(asc|desc|ASC|DESC)$")


class AuditLogListResponse(PaginatedResult[AuditLogResponse]):
    pass
