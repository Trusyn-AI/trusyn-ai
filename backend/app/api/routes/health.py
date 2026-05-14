from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.db import get_db_session
from app.core.config import settings
from app.schemas.common import SuccessResponse
from app.schemas.health import APIHealthPayload, ComponentHealthPayload, DBHealthPayload
from app.services.health_service import (
    check_cache_connection,
    check_database_connection,
    check_governance_health,
    check_ws_health,
)


router = APIRouter(tags=["health"])


@router.get("/health", response_model=SuccessResponse[APIHealthPayload])
async def health_check() -> SuccessResponse[APIHealthPayload]:
    payload = APIHealthPayload(
        status="ok",
        service=settings.app_name,
        environment=settings.app_env,
        version=settings.app_version,
        timestamp=datetime.now(UTC),
    )
    return SuccessResponse(data=payload)


@router.get("/health/db", response_model=SuccessResponse[DBHealthPayload])
async def database_health_check(
    session: AsyncSession = Depends(get_db_session),
) -> SuccessResponse[DBHealthPayload]:
    is_available, latency_ms = await check_database_connection(session)

    payload = DBHealthPayload(
        status="ok" if is_available else "error",
        database="postgresql",
        connected=is_available,
        latency_ms=latency_ms,
        timestamp=datetime.now(UTC),
    )
    return SuccessResponse(data=payload)


@router.get("/health/cache", response_model=SuccessResponse[ComponentHealthPayload])
async def cache_health_check() -> SuccessResponse[ComponentHealthPayload]:
    connected, latency_ms = await check_cache_connection()
    payload = ComponentHealthPayload(
        status="ok" if connected else "error",
        component="redis",
        connected=connected,
        latency_ms=latency_ms,
        details={"enabled": settings.redis_enabled},
        timestamp=datetime.now(UTC),
    )
    return SuccessResponse(data=payload)


@router.get("/health/ws", response_model=SuccessResponse[ComponentHealthPayload])
async def websocket_health_check() -> SuccessResponse[ComponentHealthPayload]:
    connected, details = check_ws_health()
    payload = ComponentHealthPayload(
        status="ok" if connected else "error",
        component="websocket",
        connected=connected,
        details=details,
        timestamp=datetime.now(UTC),
    )
    return SuccessResponse(data=payload)


@router.get("/health/governance", response_model=SuccessResponse[ComponentHealthPayload])
async def governance_health_check() -> SuccessResponse[ComponentHealthPayload]:
    connected, details = check_governance_health()
    payload = ComponentHealthPayload(
        status="ok" if connected else "error",
        component="governance_engine",
        connected=connected,
        details=details,
        timestamp=datetime.now(UTC),
    )
    return SuccessResponse(data=payload)

