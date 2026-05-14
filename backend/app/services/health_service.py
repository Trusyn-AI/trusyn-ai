from __future__ import annotations

from time import perf_counter

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache.redis import redis_manager
from app.events import event_bus
from app.ws.manager import ws_manager


async def check_database_connection(session: AsyncSession) -> tuple[bool, float | None]:
    """Validate active connectivity to the configured database."""
    started = perf_counter()
    try:
        result = await session.execute(text("SELECT 1"))
        latency = round((perf_counter() - started) * 1000, 3)
        return result.scalar_one() == 1, latency
    except SQLAlchemyError:
        return False, None


async def check_cache_connection() -> tuple[bool, float | None]:
    started = perf_counter()
    ok = await redis_manager.ping()
    latency = round((perf_counter() - started) * 1000, 3) if ok else None
    return ok, latency


def check_ws_health() -> tuple[bool, dict[str, object]]:
    return (
        ws_manager.is_running,
        {
            "active_connections": ws_manager.connection_count,
            "running": ws_manager.is_running,
        },
    )


def check_governance_health() -> tuple[bool, dict[str, object]]:
    return (
        event_bus.is_running,
        {
            "event_bus_running": event_bus.is_running,
            "event_queue_depth": event_bus.queue_depth,
        },
    )

