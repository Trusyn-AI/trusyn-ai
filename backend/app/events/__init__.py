from app.core.config import settings
from app.events.event_bus import EventBus
from app.events.stream_manager import EventStreamManager


event_bus = EventBus(queue_size=settings.event_bus_queue_size)
stream_manager = EventStreamManager(retention_limit=settings.event_retention_limit)

