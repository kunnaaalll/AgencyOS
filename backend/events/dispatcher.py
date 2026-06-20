from events.base import BaseEvent
from events.bus import event_bus


async def dispatch_event(event: BaseEvent) -> None:
    """Dispatch an event via the central event bus."""
    await event_bus.publish(event)
