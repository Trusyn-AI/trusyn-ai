from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Response

from app.api.deps.auth import require_role
from app.cache.cache_keys import CacheKeys
from app.cache.cache_service import cache_service
from app.core.config import settings
from app.models.enums import UserRole
from app.models.user import User
from app.observability.metrics import metrics_registry
from app.schemas.common import SuccessResponse


router = APIRouter(tags=["system"])


@router.get("/", response_model=SuccessResponse[dict[str, Any]])
async def system_info() -> SuccessResponse[dict[str, Any]]:
    """Versioned system endpoint used by platform services."""
    data: dict[str, Any] = {
        "name": settings.app_name,
        "environment": settings.app_env,
        "version": settings.app_version,
        "timestamp": datetime.now(UTC).isoformat(),
        "supported_versions": settings.api_supported_versions,
        "deprecation_notice": settings.api_deprecation_notice,
    }
    return SuccessResponse(data=data)


@router.get("/metrics", response_model=SuccessResponse[dict[str, object]])
async def telemetry_metrics(
    _: Annotated[User, Depends(require_role([UserRole.SUPER_ADMIN]))],
) -> SuccessResponse[dict[str, object]]:
    key = CacheKeys.metrics_snapshot()
    cached = await cache_service.get_json(key)
    if cached is not None:
        return SuccessResponse(data=cached, message="Telemetry metrics snapshot (cached)")
    data = await metrics_registry.snapshot()
    await cache_service.set_json(key, data, ttl_seconds=settings.metrics_cache_ttl_seconds)
    return SuccessResponse(data=data, message="Telemetry metrics snapshot")


@router.get("/metrics/prometheus")
async def prometheus_metrics(
    _: Annotated[User, Depends(require_role([UserRole.SUPER_ADMIN]))],
) -> Response:
    payload = await metrics_registry.prometheus_text()
    return Response(content=payload, media_type="text/plain; version=0.0.4")

