from __future__ import annotations

from collections import deque
from typing import Any

from app.events.event_models import PlatformEvent


class EventStreamManager:
    """In-memory retention layer for recent platform events."""

    def __init__(self, retention_limit: int = 500) -> None:
        self._retention_limit = retention_limit
        self._global_stream: deque[PlatformEvent] = deque(maxlen=retention_limit)
        self._channel_streams: dict[str, deque[PlatformEvent]] = {}

    def append(self, event: PlatformEvent, channels: list[str]) -> None:
        self._global_stream.append(event)
        for channel in channels:
            if channel not in self._channel_streams:
                self._channel_streams[channel] = deque(maxlen=self._retention_limit)
            self._channel_streams[channel].append(event)

    def recent_global(self, limit: int = 50) -> list[dict[str, Any]]:
        return [event.model_dump(mode="json") for event in list(self._global_stream)[-limit:]]

    def recent_for_channel(self, channel: str, limit: int = 50) -> list[dict[str, Any]]:
        channel_events = self._channel_streams.get(channel, deque())
        return [event.model_dump(mode="json") for event in list(channel_events)[-limit:]]

    def channels(self) -> list[str]:
        return sorted(self._channel_streams.keys())

