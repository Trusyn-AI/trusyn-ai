from __future__ import annotations

from typing import Any

from loguru import logger

from app.core.config import settings

try:
    import redis.asyncio as redis
except Exception:  # pragma: no cover
    redis = None


class RedisManager:
    """Lazy async Redis client manager."""

    def __init__(self) -> None:
        self._client: Any | None = None

    async def get_client(self):
        if not settings.redis_enabled or redis is None:
            return None
        if self._client is None:
            self._client = redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=settings.redis_connect_timeout_seconds,
            )
        return self._client

    async def ping(self) -> bool:
        client = await self.get_client()
        if client is None:
            return False
        try:
            return bool(await client.ping())
        except Exception as exc:  # pragma: no cover - external dependency
            logger.warning("redis_ping_failed", error=str(exc))
            return False

    async def close(self) -> None:
        if self._client is not None:
            try:
                await self._client.aclose()
            except Exception as exc:  # pragma: no cover
                logger.warning("redis_close_failed", error=str(exc))
            self._client = None


redis_manager = RedisManager()

