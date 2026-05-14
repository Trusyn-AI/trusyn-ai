from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.cache.redis import redis_manager
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging, logger
from app.db.session import close_engine
from app.events import event_bus, stream_manager
from app.events.subscribers import StreamRetentionSubscriber
from app.middleware import (
    APIVersionMiddleware,
    RateLimitMiddleware,
    RequestContextMiddleware,
    RequestHardeningMiddleware,
    SecurityHeadersMiddleware,
)
from app.observability.telemetry import telemetry_service
from app.tasks import (
    ScheduledTask,
    cleanup_idle_ws_connections,
    cleanup_rate_limit_buckets,
    collect_runtime_health_metrics,
    refresh_metrics_snapshot_cache,
    task_scheduler,
)
from app.ws.manager import ws_manager


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Manage application startup and shutdown lifecycle events."""
    logger.info("Starting Trusyn AI backend", environment=settings.app_env)

    retention_subscriber = StreamRetentionSubscriber(stream_manager)
    event_bus.subscribe(name="stream-retention", callback=retention_subscriber.handle, event_type=None)
    event_bus.subscribe(name="ws-broadcast", callback=ws_manager.publish_event, event_type=None)
    await event_bus.start()
    await ws_manager.start()
    await telemetry_service.start_health_stream()

    if settings.task_scheduler_enabled:
        task_scheduler.register(ScheduledTask("rate-limit-cleanup", 30, cleanup_rate_limit_buckets))
        task_scheduler.register(ScheduledTask("ws-idle-cleanup", 30, cleanup_idle_ws_connections))
        task_scheduler.register(ScheduledTask("metrics-cache-refresh", settings.metrics_cache_ttl_seconds, refresh_metrics_snapshot_cache))
        task_scheduler.register(ScheduledTask("runtime-health-metrics", 15, collect_runtime_health_metrics))
        await task_scheduler.start()

    yield

    if settings.task_scheduler_enabled:
        await task_scheduler.stop()
    await telemetry_service.stop_health_stream()
    await ws_manager.stop()
    await event_bus.stop()
    await redis_manager.close()
    await close_engine()
    logger.info("Shutting down Trusyn AI backend")


def create_application() -> FastAPI:
    """Application factory for clean initialization and testability."""
    configure_logging(settings.log_level, as_json=settings.log_json)

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        openapi_url=f"{settings.api_v1_prefix}/openapi.json",
        lifespan=lifespan,
        swagger_ui_init_oauth={"usePkceWithAuthorizationCodeGrant": False},
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(APIVersionMiddleware)
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(RequestHardeningMiddleware)
    app.add_middleware(RequestContextMiddleware)

    register_exception_handlers(app)
    app.include_router(api_router)

    return app


app = create_application()

