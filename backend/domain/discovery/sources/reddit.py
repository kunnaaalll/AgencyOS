"""
Reddit Discovery Source — DuckDuckGo-powered Reddit mention extractor.

Searches Reddit subreddits for business mentions, domains, and company names.
Uses DuckDuckGo search (site:reddit.com/r/{sub}) to find relevant posts.

Subreddits: r/mumbai, r/india, r/startups, r/smallbusiness, r/entrepreneur

Extracts: business name from post titles, domains mentioned in body/links.
"""

import asyncio
import re

import structlog
from duckduckgo_search import DDGS

from domain.discovery.sources.base import BaseDiscoverySource

logger = structlog.get_logger()

SUBREDDITS = [
    "mumbai",
    "india",
    "startups",
    "smallbusiness",
    "entrepreneur",
]

# Regex to extract domain names from text
DOMAIN_PATTERN = re.compile(
    r"(?:https?://)?(?:www\.)?([a-zA-Z0-9][a-zA-Z0-9\-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,})"
)

# Skip generic/non-business domains
SKIP_DOMAINS = {
    "reddit.com", "redd.it", "imgur.com", "youtube.com", "youtu.be",
    "google.com", "amazon.com", "amazon.in", "flipkart.com", "twitter.com",
    "facebook.com", "instagram.com", "whatsapp.com", "linkedin.com",
    "github.com", "stackoverflow.com", "medium.com", "quora.com",
    "wikipedia.org", "maps.google.com",
}

# Regex to extract business names from post titles
BUSINESS_INDICATORS = re.compile(
    r"\b(?:my|our|their|the)\s+(?:business|startup|company|agency|firm|shop|store|clinic|studio|salon|restaurant|cafe|gym)\b",
    re.IGNORECASE,
)


def _extract_business_name_from_title(title: str) -> str | None:
    """Attempt to extract a business name from a Reddit post title."""
    # Pattern: "Check out <Name>", "We launched <Name>", etc.
    patterns = [
        r'"([^"]{3,60})"',  # Quoted names
        r"'([^']{3,60})'",  # Single-quoted names
        r"\b([A-Z][a-zA-Z\s]{2,40}(?:Inc|LLC|Ltd|Pvt|Co|Corp|Studio|Agency|Group|Services|Solutions|Technologies|Tech|Digital|Media|Labs)?\.?)\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, title)
        if match:
            name = match.group(1).strip()
            if 3 < len(name) < 80:
                return name
    return None


def _clean_domain(domain: str) -> str | None:
    """Clean and validate a domain."""
    domain = domain.lower().strip()
    # Remove common query/fragment leftovers
    domain = domain.split("?")[0].split("#")[0]
    if any(skip in domain for skip in SKIP_DOMAINS):
        return None
    # Must look like a real domain
    parts = domain.split(".")
    if len(parts) < 2 or len(parts[0]) < 2:
        return None
    return domain


class RedditSource(BaseDiscoverySource):
    source_name = "reddit"

    async def _discover(self, industry: str, location: str, limit: int) -> list[dict]:
        results: list[dict] = []
        seen_domains: set[str] = set()
        seen_names: set[str] = set()
        per_sub = max(2, limit // len(SUBREDDITS) + 1)

        for subreddit in SUBREDDITS:
            if len(results) >= limit:
                break

            query = f"site:reddit.com/r/{subreddit} {industry} {location}"
            logger.debug("Reddit DuckDuckGo search", query=query)

            try:
                ddg_results = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda q=query, n=per_sub: list(DDGS().text(q, max_results=n)),
                )

                for res in ddg_results:
                    if len(results) >= limit:
                        break

                    title = res.get("title", "")
                    body = res.get("body", "")
                    url = res.get("href", "")

                    # Try to extract a business name
                    business_name = _extract_business_name_from_title(title)

                    # Try to extract a domain from body
                    website = None
                    for match in DOMAIN_PATTERN.finditer(body + " " + title):
                        domain = _clean_domain(match.group(1))
                        if domain and domain not in seen_domains:
                            seen_domains.add(domain)
                            website = f"https://{domain}"
                            if not business_name:
                                business_name = domain.split(".")[0].replace("-", " ").title()
                            break

                    # Skip if no meaningful data
                    if not business_name:
                        business_name = f"{industry.title()} ({location}) — Reddit mention"

                    # Deduplicate
                    name_key = business_name.lower().strip()
                    if name_key in seen_names:
                        continue
                    seen_names.add(name_key)

                    results.append(
                        self._make_business_dict(
                            business_name=business_name[:255],
                            industry=industry,
                            location=location,
                            city=location,
                            website=website,
                            raw_payload={
                                "source_type": "reddit",
                                "subreddit": subreddit,
                                "reddit_url": url,
                                "post_title": title[:500],
                                "post_body": body[:1000],
                            },
                        )
                    )

                await self._short_delay()

            except Exception as e:
                logger.warning("Reddit DuckDuckGo search failed", subreddit=subreddit, error=str(e))
                await asyncio.sleep(2)

        return results
