"""
AgencyOS V2 — Event System Architecture

This module provides the foundation for event-driven workflows.
Events will be used in future phases for:

- CRM events (contact created, deal updated)
- Outreach events (email sent, sequence triggered)
- Finance events (invoice paid, payment overdue)
- AI pipeline events (enrichment completed, lead scored)

Phase 1: Architecture stub only.
Phase 2+: Business events will be implemented here.
"""

from .base import BaseEvent, EventMetadata
from .bus import EventBus

__all__ = ["BaseEvent", "EventMetadata", "EventBus"]
