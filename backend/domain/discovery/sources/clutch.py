"""
Clutch Discovery Source — Playwright-based scraper for clutch.co.

Clutch is the leading B2B directory for agencies, IT firms, and professional services.
Targets: /agencies, /developers, /it-services listings.

Extracts: company name, website, location, employee count, review count.
"""

import re
import asyncio
import structlog
from bs4 import BeautifulSoup
from urllib.parse import quote

from domain.discovery.sources.base import BaseDiscoverySource
from utils.browser_pool import get_browser_pool

logger = structlog.get_logger()

CLUTCH_BASE = "https://clutch.co"

# Category slugs relevant to the target industries
CLUTCH_CATEGORIES = {
    "digital marketing agency": "/agencies/digital-marketing/india",
    "marketing agency": "/agencies/digital-marketing/india",
    "interior designer": "/agencies/interior-design/india",
    "architect": "/agencies/architectural-design/india",
    "it company": "/it-services/india",
    "software development": "/developers/india",
    "web design": "/agencies/web-design/india",
    "seo": "/agencies/seo/india",
}

DEFAULT_CLUTCH_PATH = "/agencies/india"


def _get_clutch_path(industry: str) -> str:
    industry_lower = industry.lower()
    for key, path in CLUTCH_CATEGORIES.items():
        if key in industry_lower:
            return path
    return DEFAULT_CLUTCH_PATH


class ClutchSource(BaseDiscoverySource):
    source_name = "clutch"

    async def _discover(self, industry: str, location: str, limit: int) -> list[dict]:
        pool = get_browser_pool()
        results: list[dict] = []

        path = _get_clutch_path(industry)
        url = f"{CLUTCH_BASE}{path}"

        logger.debug("Clutch search", url=url)

        async with pool.acquire_context() as (page, context):
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                await self._random_delay()

                # Accept cookies
                try:
                    accept = page.locator('button:has-text("Accept"), button:has-text("I agree")').first
                    if await accept.is_visible(timeout=3000):
                        await accept.click()
                        await asyncio.sleep(0.5)
                except Exception:
                    pass

                # Wait for listings
                try:
                    await page.wait_for_selector(
                        'li.directory-list-item, div[class*="provider"], article.sg-provider',
                        timeout=15000,
                    )
                except Exception:
                    pass

                # Scroll to load lazy-loaded content
                for _ in range(min(5, limit // 5 + 1)):
                    await page.evaluate("window.scrollBy(0, 1500)")
                    await asyncio.sleep(1.0)

                content = await page.content()
                results = self._parse_listings(content, industry, location, limit)

            except Exception as e:
                logger.error("Clutch scraping error", error=str(e))

        return results

    def _parse_listings(
        self, html: str, industry: str, location: str, limit: int
    ) -> list[dict]:
        soup = BeautifulSoup(html, "html.parser")
        results = []

        listings = (
            soup.select("li.directory-list-item")
            or soup.select("div[class*='provider-row']")
            or soup.select("article.sg-provider")
            or soup.select("div.company-listing")
        )

        for item in listings[:limit]:
            try:
                # Company name
                name_el = (
                    item.select_one("h3.company_info--name a")
                    or item.select_one("h3 a[href*='/profile/']")
                    or item.select_one(".company-name a")
                    or item.select_one("h3.company_info--name")
                )
                if not name_el:
                    continue
                name = name_el.get_text(strip=True)
                if not name:
                    continue

                # Website — usually a sponsored link or company profile link
                website = None
                website_el = item.select_one(
                    "a[data-event='click'][href*='http']:not([href*='clutch.co'])"
                )
                if website_el:
                    website = website_el.get("href")

                # Location
                loc_el = (
                    item.select_one("span[class*='locality']")
                    or item.select_one("p.company_info--location")
                    or item.select_one("span.location")
                )
                business_location = loc_el.get_text(strip=True) if loc_el else location
                city = business_location.split(",")[0].strip() if business_location else location

                # Rating
                rating_el = item.select_one(
                    "span.sg-rating__number, span[class*='rating-value']"
                )
                rating = None
                if rating_el:
                    try:
                        rating = float(rating_el.get_text(strip=True))
                    except ValueError:
                        pass

                # Review count
                review_el = item.select_one(
                    "a[href*='/reviews'] span, span[class*='review-count']"
                )
                review_count = None
                if review_el:
                    match = re.search(r"\d+", review_el.get_text())
                    if match:
                        review_count = int(match.group())

                # Employee count
                emp_el = item.select_one("span[class*='employees'], span[class*='size']")
                employees = emp_el.get_text(strip=True) if emp_el else None

                results.append(
                    self._make_business_dict(
                        business_name=name,
                        industry=industry,
                        location=location,
                        city=city,
                        website=website,
                        rating=rating,
                        review_count=review_count,
                        raw_payload={
                            "source_type": "clutch",
                            "industry": industry,
                            "location": business_location,
                            "employees": employees,
                        },
                    )
                )
            except Exception as e:
                logger.debug("Error parsing Clutch item", error=str(e))
                continue

        return results
