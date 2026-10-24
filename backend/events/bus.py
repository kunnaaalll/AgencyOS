"""
AgencyOS V2 — Event Bus (In-Process Stub)

Phase 1: Simple in-process event bus.
Future phases will replace this with Redis Pub/Sub or a message broker.
"""

import asyncio
from collections import defaultdict
from collections.abc import Callable, Coroutine
from typing import Any

from events.base import BaseEvent

Handler = Callable[[BaseEvent], Coroutine[Any, Any, None]]


class EventBus:
    """
    Simple in-process event bus for decoupled event handling.
    Supports both EventBus.publish(...) and event_bus.publish(...).
    """

    _handlers: dict[str, list[Handler]] = defaultdict(list)

    def __init__(self) -> None:
        pass

    @classmethod
    def subscribe(cls, event_type: str) -> Callable[[Handler], Handler]:
        """Decorator to register an event handler."""

        def decorator(handler: Handler) -> Handler:
            cls._handlers[event_type].append(handler)
            return handler

        return decorator

    @classmethod
    async def publish(cls, event: BaseEvent) -> None:
        """Publish an event to all registered handlers."""
        handlers = cls._handlers.get(event.event_type, [])
        if handlers:
            await asyncio.gather(*[handler(event) for handler in handlers], return_exceptions=True)

    @classmethod
    def clear(cls) -> None:
        """Clear all handlers (useful for testing)."""
        cls._handlers.clear()


# Singleton event bus instance
event_bus = EventBus()
