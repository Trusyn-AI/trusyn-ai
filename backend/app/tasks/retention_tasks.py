from __future__ import annotations

from app.cache.cache_keys import CacheKeys
from app.cache.cache_service import cache_service
from app.observability.metrics import metrics_registry


async def refresh_metrics_snapshot_cache() -> None:
    snapshot = await metrics_registry.snapshot()
    await cache_service.set_json(CacheKeys.metrics_snapshot(), snapshot)

