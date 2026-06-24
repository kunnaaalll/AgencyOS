"""
Google Search Discovery Source — DuckDuckGo-based discovery.

Uses multiple query patterns to discover businesses via DuckDuckGo:
  - "{industry} {location}"
  - "site:.in {industry} {location}"
  - "{industry} near {location}"

Extracts: business name, website URL, meta description, inferred industry.
No browser needed — uses the duckduckgo_search library directly.
"""

import asyncio
import re

import structlog
from crawl4ai import AsyncWebCrawler
from duckduckgo_search import DDGS

from domain.discovery.sources.base import BaseDiscoverySource

logger = structlog.get_logger()

# Query patterns for broad coverage
QUERY_PATTERNS = [
    "{industry} {location}",
    "site:.in {industry} {location}",
    "{industry} near {location}",
    "{industry} in {location} contact",
]

# Domains to skip (aggregators, not actual businesses)
SKIP_DOMAINS = {
    "justdial.com",
    "indiamart.com",
    "sulekha.com",
    "tradeindia.com",
    "yellowpages.in",
    "asklaila.com",
    "shopclues.com",
    "amazon.in",
    "flipkart.com",
    "zomato.com",
    "swiggy.com",
    "practo.com",
    "booking.com",
    "tripadvisor.com",
    "yelp.com",
    "facebook.com",
    "twitter.com",
    "instagram.com",
    "linkedin.com",
    "youtube.com",
    "wikipedia.org",
    "google.com",
    "reddit.com",
}


def _extract_domain(url: str) -> str:
    """Extract root domain from URL."""
    url = url.lower().replace("https://", "").replace("http://", "").replace("www.", "")
    return url.split("/")[0]


def _is_valid_business_url(url: str) -> bool:
    """Filter out aggregator/social domains."""
    if not url or not url.startswith("http"):
        return False
    domain = _extract_domain(url)
    return not any(skip in domain for skip in SKIP_DOMAINS)


def _infer_business_name(title: str, url: str) -> str:
    """Try to extract a clean business name from search result title."""
    # Remove common suffixes like "| Official Website", "- Home", etc.
    name = re.sub(r"\s*[\|\-–—]\s*.*$", "", title).strip()
    if not name:
        # Fall back to domain name
        domain = _extract_domain(url)
        name = domain.split(".")[0].replace("-", " ").title()
    return name[:255]


class GoogleSearchSource(BaseDiscoverySource):
    source_name = "google_search"

    async def _discover(self, industry: str, location: str, limit: int) -> list[dict]:
        results: list[dict] = []
        seen_urls: set[str] = set()
        per_query = max(3, limit // len(QUERY_PATTERNS) + 1)

        for pattern in QUERY_PATTERNS:
            if len(results) >= limit:
                break

            query = pattern.format(industry=industry, location=location)
            logger.debug("GoogleSearch query", query=query)

            try:
                # DuckDuckGo search is sync, run in thread pool
                ddg_results = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda q=query, n=per_query: list(DDGS().text(q, max_results=n)),
                )

                for res in ddg_results:
                    if len(results) >= limit:
                        break

                    url = res.get("href", "")
                    if not _is_valid_business_url(url):
                        continue

                    domain = _extract_domain(url)
                    if domain in seen_urls:
                        continue
                    seen_urls.add(domain)

                    title = res.get("title", "")
                    description = res.get("body", "")
                    name = _infer_business_name(title, url)

                    markdown_content = ""
                    try:
                        async with AsyncWebCrawler(verbose=False) as crawler:
                            crawl_result = await crawler.arun(url=url)
                            markdown_content = (
                                crawl_result.markdown[:5000]
                                if crawl_result and crawl_result.markdown
                                else ""
                            )
                    except Exception as e:
                        logger.warning("Crawl4AI extraction failed", url=url, error=str(e))

                    results.append(
                        self._make_business_dict(
                            business_name=name,
                            industry=industry,
                            location=location,
                            city=location,
                            website=url,
                            raw_payload={
                                "source_type": "google_search",
                                "query": query,
                                "title": title,
                                "description": description,
                                "ddg_href": url,
                                "markdown": markdown_content,
                            },
                        )
                    )

                # Polite delay between queries
                await self._short_delay()

            except Exception as e:
                logger.warning("DuckDuckGo search failed", query=query, error=str(e))
                await asyncio.sleep(2)

        return results
