"""
AgencyOS V2 — Event Bus (In-Process Stub)

Phase 1: Simple in-process event bus.
Future phases will replace this with Redis Pub/Sub or a message broker.
"""

import asyncio
from collections import defaultdict
from typing import Any, Callable, Coroutine

from events.base import BaseEvent

Handler = Callable[[BaseEvent], Coroutine[Any, Any, None]]


class EventBus:
    """
    Simple in-process event bus for decoupled event handling.

    Usage:
        bus = EventBus()

        @bus.subscribe("contact.created")
        async def handle_contact_created(event: ContactCreatedEvent):
            await send_welcome_email(event.email)

        await bus.publish(ContactCreatedEvent(...))
    """

    def __init__(self) -> None:
        self._handlers: dict[str, list[Handler]] = defaultdict(list)

    def subscribe(self, event_type: str) -> Callable[[Handler], Handler]:
        """Decorator to register an event handler."""

        def decorator(handler: Handler) -> Handler:
            self._handlers[event_type].append(handler)
            return handler

        return decorator

    async def publish(self, event: BaseEvent) -> None:
        """Publish an event to all registered handlers."""
        handlers = self._handlers.get(event.event_type, [])
        if handlers:
            await asyncio.gather(*[handler(event) for handler in handlers])

    def clear(self) -> None:
        """Clear all handlers (useful for testing)."""
        self._handlers.clear()


# Singleton event bus instance
event_bus = EventBus()
