from __future__ import annotations

from contextlib import asynccontextmanager
from time import perf_counter

from loguru import logger

from app.observability.metrics import metrics_registry


@asynccontextmanager
async def measure_operation(metric_name: str, *, request_id: str | None = None):
    """Capture operation latency and push into metrics."""
    start = perf_counter()
    try:
        yield
    finally:
        duration_ms = round((perf_counter() - start) * 1000, 3)
        await metrics_registry.observe(metric_name, duration_ms)
        logger.info("operation_timing", metric=metric_name, duration_ms=duration_ms, request_id=request_id)

