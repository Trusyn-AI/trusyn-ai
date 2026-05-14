from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from typing import Any

from loguru import logger

from app.cache.redis import redis_manager
from app.core.config import settings
from app.observability.metrics import metrics_registry


class CacheService:
    """Cache abstraction with graceful fallback when Redis is unavailable."""

    def __init__(self, namespace: str = "trusyn") -> None:
        self.namespace = namespace
        self._local_fallback: dict[str, tuple[datetime, str]] = {}

    def _key(self, key: str) -> str:
        return f"{self.namespace}:{key}"

    async def get(self, key: str) -> str | None:
        full_key = self._key(key)
        client = await redis_manager.get_client()
        if client is not None:
            try:
                value = await client.get(full_key)
                await metrics_registry.increment("cache.get.total")
                if value is not None:
                    await metrics_registry.increment("cache.hit.total")
                else:
                    await metrics_registry.increment("cache.miss.total")
                return value
            except Exception as exc:  # pragma: no cover
                logger.warning("cache_get_failed", key=full_key, error=str(exc))

        fallback = self._local_fallback.get(full_key)
        if fallback and datetime.now(UTC) <= fallback[0]:
            return fallback[1]
        self._local_fallback.pop(full_key, None)
        return None

    async def set(self, key: str, value: str, ttl_seconds: int | None = None) -> None:
        full_key = self._key(key)
        ttl = ttl_seconds or settings.redis_default_ttl_seconds
        client = await redis_manager.get_client()
        if client is not None:
            try:
                await client.set(full_key, value, ex=ttl)
                await metrics_registry.increment("cache.set.total")
                return
            except Exception as exc:  # pragma: no cover
                logger.warning("cache_set_failed", key=full_key, error=str(exc))

        self._local_fallback[full_key] = (datetime.now(UTC) + timedelta(seconds=ttl), value)

    async def delete(self, key: str) -> None:
        full_key = self._key(key)
        client = await redis_manager.get_client()
        if client is not None:
            try:
                await client.delete(full_key)
                await metrics_registry.increment("cache.delete.total")
            except Exception as exc:  # pragma: no cover
                logger.warning("cache_delete_failed", key=full_key, error=str(exc))
        self._local_fallback.pop(full_key, None)

    async def get_json(self, key: str) -> dict[str, Any] | list[Any] | None:
        raw = await self.get(key)
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return None

    async def set_json(self, key: str, value: dict[str, Any] | list[Any], ttl_seconds: int | None = None) -> None:
        await self.set(key, json.dumps(value, ensure_ascii=True), ttl_seconds=ttl_seconds)


cache_service = CacheService()

