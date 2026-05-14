from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from typing import Any, Awaitable, Callable, TypeVar


T = TypeVar("T")


async def async_retry(
    fn: Callable[[], Awaitable[T]],
    *,
    attempts: int,
    backoff_seconds: float,
    retry_exceptions: tuple[type[Exception], ...] = (Exception,),
) -> T:
    if attempts < 1:
        raise ValueError("attempts must be >= 1")
    delay = max(0.01, backoff_seconds)
    last_error: Exception | None = None
    for index in range(attempts):
        try:
            return await fn()
        except retry_exceptions as exc:
            last_error = exc
            if index == attempts - 1:
                break
            await asyncio.sleep(delay)
            delay *= 2
    raise last_error if last_error else RuntimeError("retry_exhausted")


async def with_timeout(awaitable: Awaitable[T], *, timeout_seconds: int) -> T:
    async with asyncio.timeout(timeout_seconds):
        return await awaitable


@dataclass(slots=True)
class CircuitBreaker:
    failure_threshold: int
    recovery_seconds: int
    failure_count: int = 0
    opened_at: datetime | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def is_open(self) -> bool:
        if self.opened_at is None:
            return False
        return datetime.now(UTC) < (self.opened_at + timedelta(seconds=self.recovery_seconds))

    def record_success(self) -> None:
        self.failure_count = 0
        self.opened_at = None

    def record_failure(self) -> None:
        self.failure_count += 1
        if self.failure_count >= self.failure_threshold:
            self.opened_at = datetime.now(UTC)

