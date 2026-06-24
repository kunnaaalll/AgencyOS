"""Discovery sources package."""

from domain.discovery.sources.base import BaseDiscoverySource
from domain.discovery.sources.clutch import ClutchSource
from domain.discovery.sources.crawl4ai_web import Crawl4AISource
from domain.discovery.sources.google_maps import GoogleMapsSource
from domain.discovery.sources.google_search import GoogleSearchSource
from domain.discovery.sources.indiamart import IndiaMartSource
from domain.discovery.sources.justdial import JustDialSource
from domain.discovery.sources.reddit import RedditSource

# Source registry — maps source name → class
SOURCE_REGISTRY: dict[str, type[BaseDiscoverySource]] = {
    "google_maps": GoogleMapsSource,
    "google_search": GoogleSearchSource,
    "justdial": JustDialSource,
    "indiamart": IndiaMartSource,
    "clutch": ClutchSource,
    "reddit": RedditSource,
    "crawl4ai_web": Crawl4AISource,
}

ALL_SOURCES = list(SOURCE_REGISTRY.keys())


def get_source(name: str) -> BaseDiscoverySource | None:
    """Instantiate and return a discovery source by name."""
    cls = SOURCE_REGISTRY.get(name)
    if cls:
        return cls()
    return None


__all__ = [
    "BaseDiscoverySource",
    "GoogleMapsSource",
    "GoogleSearchSource",
    "JustDialSource",
    "IndiaMartSource",
    "ClutchSource",
    "RedditSource",
    "Crawl4AISource",
    "SOURCE_REGISTRY",
    "ALL_SOURCES",
    "get_source",
]
