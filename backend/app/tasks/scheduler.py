from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from dataclasses import dataclass

from loguru import logger


TaskCallback = Callable[[], Awaitable[None]]


@dataclass(slots=True)
class ScheduledTask:
    name: str
    interval_seconds: int
    callback: TaskCallback


class BackgroundTaskScheduler:
    """Simple periodic scheduler for infrastructure background tasks."""

    def __init__(self) -> None:
        self._tasks: list[ScheduledTask] = []
        self._runners: list[asyncio.Task[None]] = []
        self._running = False

    def register(self, task: ScheduledTask) -> None:
        self._tasks = [item for item in self._tasks if item.name != task.name]
        self._tasks.append(task)

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        for task in self._tasks:
            runner = asyncio.create_task(self._run_periodic(task), name=f"scheduler:{task.name}")
            self._runners.append(runner)
        logger.info("task_scheduler_started", tasks=[item.name for item in self._tasks])

    async def stop(self) -> None:
        self._running = False
        for runner in self._runners:
            runner.cancel()
        for runner in self._runners:
            try:
                await runner
            except asyncio.CancelledError:
                pass
        self._runners.clear()
        logger.info("task_scheduler_stopped")

    async def _run_periodic(self, task: ScheduledTask) -> None:
        while self._running:
            try:
                await task.callback()
            except Exception as exc:
                logger.exception("scheduled_task_failed", task=task.name, error=str(exc))
            await asyncio.sleep(max(1, task.interval_seconds))


task_scheduler = BackgroundTaskScheduler()
