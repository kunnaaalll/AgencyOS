"""
Base Discovery Source — Abstract base class for all discovery sources.

Provides:
  - Randomized delays (2–5 seconds)
  - Retry logic with exponential backoff (3 retries)
  - Rate limiting via SourceRateLimiter
  - Consistent logging
"""

import asyncio
import random
from abc import ABC, abstractmethod

import structlog

from utils.rate_limiter import get_rate_limiter

logger = structlog.get_logger()

# Delay configuration
DELAY_MIN_SECONDS = 2.0
DELAY_MAX_SECONDS = 5.0

# Retry configuration
MAX_RETRIES = 3
BACKOFF_BASE = 2.0  # seconds


class BaseDiscoverySource(ABC):
    """Abstract base class for all discovery sources."""

    source_name: str = "base"

    async def discover(self, industry: str, location: str, limit: int) -> list[dict]:
        """
        Main entry point. Applies rate limiting then calls _discover().
        Returns list of raw business dicts.
        """
        rate_limiter = get_rate_limiter()
        await rate_limiter.acquire(self.source_name)

        log = logger.bind(
            source=self.source_name, industry=industry, location=location, limit=limit
        )
        log.info("Starting discovery")

        try:
            results = await self._retry(
                self._discover, industry=industry, location=location, limit=limit
            )
            log.info("Discovery complete", count=len(results))
            return results
        except Exception as e:
            log.error("Discovery failed", error=str(e))
            return []

    @abstractmethod
    async def _discover(self, industry: str, location: str, limit: int) -> list[dict]:
        """Implement source-specific discovery logic."""
        pass

    async def _random_delay(self):
        """Sleep for a random duration between DELAY_MIN and DELAY_MAX seconds."""
        delay = random.uniform(DELAY_MIN_SECONDS, DELAY_MAX_SECONDS)
        await asyncio.sleep(delay)

    async def _short_delay(self):
        """Short delay (0.5-1.5s) for between-card interactions."""
        await asyncio.sleep(random.uniform(0.5, 1.5))

    async def _retry(self, fn, **kwargs) -> list[dict]:
        """
        Execute fn with retry logic.
        Retries up to MAX_RETRIES times with exponential backoff.
        """
        last_error: Exception | None = None

        for attempt in range(MAX_RETRIES):
            try:
                return await fn(**kwargs)
            except Exception as e:
                last_error = e
                if attempt < MAX_RETRIES - 1:
                    wait = BACKOFF_BASE ** (attempt + 1) + random.uniform(0, 1)
                    logger.warning(
                        "Retrying after error",
                        source=self.source_name,
                        attempt=attempt + 1,
                        wait=round(wait, 1),
                        error=str(e),
                    )
                    await asyncio.sleep(wait)

        raise last_error or RuntimeError(f"All {MAX_RETRIES} retries exhausted")

    def _make_business_dict(
        self,
        business_name: str,
        industry: str,
        location: str,
        **kwargs,
    ) -> dict:
        """Helper to create a consistently structured business dict."""
        return {
            "source": self.source_name,
            "business_name": business_name.strip(),
            "industry": industry,
            "city": kwargs.get("city") or location,
            "address": kwargs.get("address"),
            "state": kwargs.get("state", "Maharashtra"),
            "country": kwargs.get("country", "India"),
            "website": kwargs.get("website"),
            "phone": kwargs.get("phone"),
            "email": kwargs.get("email"),
            "rating": kwargs.get("rating"),
            "review_count": kwargs.get("review_count"),
            "google_maps_url": kwargs.get("google_maps_url"),
            "google_rating": kwargs.get("google_rating"),
            "opening_hours": kwargs.get("opening_hours", {}),
            "raw_payload": kwargs.get("raw_payload", {}),
        }
