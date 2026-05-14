from __future__ import annotations

from app.cache.redis import redis_manager
from app.events import event_bus
from app.observability.metrics import metrics_registry
from app.ws.manager import ws_manager


async def collect_runtime_health_metrics() -> None:
    await metrics_registry.set_gauge("runtime.event_queue.depth", float(event_bus.queue_depth))
    await metrics_registry.set_gauge("runtime.ws.connections", float(ws_manager.connection_count))
    redis_ok = await redis_manager.ping()
    await metrics_registry.set_gauge("runtime.redis.up", 1.0 if redis_ok else 0.0)

