from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class APIHealthPayload(BaseModel):
    status: Literal["ok", "error"]
    service: str
    environment: str
    version: str
    timestamp: datetime


class DBHealthPayload(BaseModel):
    status: Literal["ok", "error"]
    database: str
    connected: bool
    latency_ms: float | None = None
    timestamp: datetime


class ComponentHealthPayload(BaseModel):
    status: Literal["ok", "error"]
    component: str
    connected: bool
    latency_ms: float | None = None
    details: dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime

