from __future__ import annotations

from app.middleware.rate_limit import rate_limiter
from app.ws.manager import ws_manager


async def cleanup_rate_limit_buckets() -> None:
    await rate_limiter.cleanup()


async def cleanup_idle_ws_connections() -> None:
    await ws_manager.cleanup_idle_connections()

