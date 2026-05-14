from __future__ import annotations

import asyncio
from collections import defaultdict
from collections.abc import Awaitable, Callable
from dataclasses import dataclass

from loguru import logger

from app.core.config import settings
from app.events.event_models import EventType, PlatformEvent


SubscriberCallback = Callable[[PlatformEvent], Awaitable[None]]


@dataclass(slots=True)
class Subscription:
    name: str
    callback: SubscriberCallback


class EventBus:
    """Async in-memory event bus with queue-based dispatch.

    This abstraction is intentionally decoupled from transport concerns so it can
    be swapped for Redis/Kafka/NATS in future phases.
    """

    def __init__(self, queue_size: int) -> None:
        self._queue: asyncio.Queue[PlatformEvent] | None = None
        self._queue_size = queue_size
        self._subscribers: dict[EventType | None, dict[str, Subscription]] = defaultdict(dict)
        self._worker_task: asyncio.Task[None] | None = None
        self._running = False

    @property
    def queue_depth(self) -> int:
        return self._queue.qsize() if self._queue is not None else 0

    @property
    def is_running(self) -> bool:
        return self._running

    async def start(self) -> None:
        if self._running:
            return
        self._queue = asyncio.Queue(maxsize=self._queue_size)
        self._running = True
        self._worker_task = asyncio.create_task(self._worker_loop(), name="event-bus-worker")
        logger.info("event_bus_started", queue_size=settings.event_bus_queue_size)

    async def stop(self) -> None:
        if not self._running:
            return
        self._running = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
        self._queue = None
        logger.info("event_bus_stopped")

    def subscribe(
        self,
        *,
        name: str,
        callback: SubscriberCallback,
        event_type: EventType | None = None,
    ) -> None:
        self._subscribers[event_type][name] = Subscription(name=name, callback=callback)
        logger.debug("event_bus_subscribed", subscriber=name, event_type=event_type)

    def unsubscribe(self, *, name: str, event_type: EventType | None = None) -> None:
        if name in self._subscribers[event_type]:
            del self._subscribers[event_type][name]
            logger.debug("event_bus_unsubscribed", subscriber=name, event_type=event_type)

    async def publish(self, event: PlatformEvent) -> None:
        if not self._running:
            logger.debug("event_bus_not_running_drop", event_type=event.event_type)
            return
        if self._queue is None:
            return
        try:
            self._queue.put_nowait(event)
        except asyncio.QueueFull:
            logger.warning("event_bus_queue_full_drop", event_type=event.event_type, queue_depth=self.queue_depth)

    async def _worker_loop(self) -> None:
        while self._running:
            if self._queue is None:
                await asyncio.sleep(0.01)
                continue
            event = await self._queue.get()
            await self._dispatch(event)
            self._queue.task_done()

    async def _dispatch(self, event: PlatformEvent) -> None:
        specific = list(self._subscribers[event.event_type].values())
        wildcard = list(self._subscribers[None].values())
        subscriptions = specific + wildcard
        if not subscriptions:
            return

        tasks = [subscription.callback(event) for subscription in subscriptions]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for idx, result in enumerate(results):
            if isinstance(result, Exception):
                logger.exception(
                    "event_subscriber_failed",
                    event_type=event.event_type,
                    subscriber=subscriptions[idx].name,
                    error=str(result),
                )
