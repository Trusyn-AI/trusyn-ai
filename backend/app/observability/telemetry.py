from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from typing import Any

from app.core.config import settings
from app.events import event_bus
from app.events.publishers import publish_system_health_event
from app.models.enums import GovernanceDecisionType, ThreatSeverity
from app.observability.metrics import metrics_registry
from app.services.health_service import check_cache_connection, check_database_connection
from app.ws.manager import ws_manager


class TelemetryService:
    """Structured telemetry sink for runtime governance operations."""

    def __init__(self) -> None:
        self._health_task: asyncio.Task[None] | None = None
        self._running = False

    async def record_gateway_latency(self, *, duration_ms: float) -> None:
        await metrics_registry.observe("gateway.latency_ms", duration_ms)
        await metrics_registry.increment("gateway.requests.total")

    async def record_threat_detected(self, *, severity: ThreatSeverity) -> None:
        await metrics_registry.increment("governance.threats.total")
        await metrics_registry.increment(f"governance.threats.severity.{severity.value.lower()}")

    async def record_policy_matches(self, *, count: int) -> None:
        await metrics_registry.increment("governance.policy_matches.total", max(0, count))

    async def record_decision(self, *, decision: GovernanceDecisionType) -> None:
        await metrics_registry.increment("governance.decisions.total")
        await metrics_registry.increment(f"governance.decisions.{decision.value.lower()}")
        if decision == GovernanceDecisionType.BLOCK:
            await metrics_registry.increment("governance.blocked_requests.total")

    async def set_event_queue_depth(self) -> None:
        await metrics_registry.set_gauge("events.queue.depth", float(event_bus.queue_depth))

    async def set_ws_connections(self) -> None:
        await metrics_registry.set_gauge("ws.connections.active", float(ws_manager.connection_count))

    async def start_health_stream(self) -> None:
        if self._running:
            return
        self._running = True
        self._health_task = asyncio.create_task(self._health_loop(), name="telemetry-health-stream")

    async def stop_health_stream(self) -> None:
        self._running = False
        if self._health_task:
            self._health_task.cancel()
            try:
                await self._health_task
            except asyncio.CancelledError:
                pass

    async def _health_loop(self) -> None:
        from app.db.session import async_session_factory

        while self._running:
            db_ok = False
            db_latency_ms = None
            async with async_session_factory() as session:
                db_ok, db_latency_ms = await check_database_connection(session)
            cache_ok, cache_latency_ms = await check_cache_connection()

            payload: dict[str, Any] = {
                "timestamp": datetime.now(UTC).isoformat(),
                "db_connectivity": db_ok,
                "db_latency_ms": db_latency_ms,
                "cache_connectivity": cache_ok,
                "cache_latency_ms": cache_latency_ms,
                "gemini_configured": bool(settings.gemini_api_key),
                "governance_engine": "ok",
                "websocket_connections": ws_manager.connection_count,
                "event_queue_depth": event_bus.queue_depth,
            }
            severity = ThreatSeverity.LOW if db_ok and cache_ok else ThreatSeverity.HIGH
            await publish_system_health_event(payload=payload, severity=severity)
            await self.set_event_queue_depth()
            await self.set_ws_connections()
            await metrics_registry.set_gauge("runtime.db.up", 1.0 if db_ok else 0.0)
            await metrics_registry.set_gauge("runtime.cache.up", 1.0 if cache_ok else 0.0)
            await asyncio.sleep(settings.health_stream_interval_seconds)


telemetry_service = TelemetryService()
