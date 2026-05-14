from __future__ import annotations

from app.events.event_models import PlatformEvent
from app.events.stream_manager import EventStreamManager
from app.ws.channels import channels_for_event


class StreamRetentionSubscriber:
    """Stores published events in channel streams for dashboard replay."""

    def __init__(self, stream_manager: EventStreamManager) -> None:
        self._stream_manager = stream_manager

    async def handle(self, event: PlatformEvent) -> None:
        self._stream_manager.append(event, channels_for_event(event))

