"""
JustDial Discovery Source — Playwright-based scraper for justdial.com.

JustDial is India's largest local business directory.
URL pattern: https://www.justdial.com/{city}/{industry}

Extracts: business name, phone, website, address, category, rating.

Anti-blocking: realistic UA, cookie acceptance, human-like delays.
"""

import asyncio
import re

import structlog
from bs4 import BeautifulSoup

from domain.discovery.sources.base import BaseDiscoverySource
from utils.browser_pool import get_browser_pool
from utils.user_agent_rotator import UserAgentRotator

logger = structlog.get_logger()

JUSTDIAL_BASE = "https://www.justdial.com"

# City name normalization for JustDial URLs
CITY_MAP = {
    "andheri": "Mumbai",
    "borivali": "Mumbai",
    "bandra": "Mumbai",
    "malad": "Mumbai",
    "kandivali": "Mumbai",
    "goregaon": "Mumbai",
    "powai": "Mumbai",
    "dadar": "Mumbai",
    "chembur": "Mumbai",
    "thane": "Thane",
    "navi mumbai": "Navi-Mumbai",
    "mumbai": "Mumbai",
}


def _get_jd_city(location: str) -> str:
    loc_lower = location.lower().strip()
    return CITY_MAP.get(loc_lower, location.replace(" ", "-").title())


class JustDialSource(BaseDiscoverySource):
    source_name = "justdial"

    async def _discover(self, industry: str, location: str, limit: int) -> list[dict]:
        pool = get_browser_pool()
        results: list[dict] = []

        city = _get_jd_city(location)
        industry_slug = industry.replace(" ", "-").lower()
        url = f"{JUSTDIAL_BASE}/{city}/{industry_slug}"

        logger.debug("JustDial search", url=url)

        async with pool.acquire_context() as (page, context):
            try:
                # Use Indian mobile UA for JustDial (better compatibility)
                ua = UserAgentRotator.get_indian_mobile()
                await context.set_extra_http_headers({"User-Agent": ua})

                await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                await self._random_delay()

                # Accept cookies / close popups
                for selector in [
                    'button:has-text("Accept")',
                    'button:has-text("OK")',
                    '.popup-close',
                    '[class*="close"]',
                    '#modal-close',
                ]:
                    try:
                        btn = page.locator(selector).first
                        if await btn.is_visible(timeout=2000):
                            await btn.click()
                            await asyncio.sleep(0.5)
                            break
                    except Exception:
                        pass

                # Wait for listings to appear
                await page.wait_for_selector(
                    'li[class*="cntanr"], div[class*="store-card"], .resultbox_info',
                    timeout=15000,
                )

                # Scroll to load more results
                for _ in range(min(5, limit // 5 + 1)):
                    await page.evaluate("window.scrollBy(0, 2000)")
                    await asyncio.sleep(1.2)

                content = await page.content()
                results = self._parse_listings(content, industry, location, limit)

            except Exception as e:
                logger.error("JustDial scraping error", error=str(e), url=url)

        return results

    def _parse_listings(
        self, html: str, industry: str, location: str, limit: int
    ) -> list[dict]:
        """Parse JustDial listing HTML."""
        soup = BeautifulSoup(html, "html.parser")
        results = []

        # JustDial uses various selectors across redesigns
        listing_selectors = [
            "li.cntanr",
            "div.resultbox_info",
            "div[class*='store-card']",
            "div[class*='jsx-']",
            "li[class*='cntanr']",
        ]

        listings = []
        for sel in listing_selectors:
            listings = soup.select(sel)
            if listings:
                break

        if not listings:
            # Fallback: find all named anchors that look like business names
            listings = soup.select("a[class*='business-name'], a[class*='store-name']")

        for item in listings[:limit]:
            try:
                # Name
                name_el = item.select_one(
                    "a.resultbox_title_anchor, span.jd-heading, a[class*='store-name'], h2 a, .business-name"
                )
                if not name_el:
                    name_el = item.select_one("a[href*='/mumbai/'], a[href*='/thane/']")
                if not name_el:
                    continue
                name = name_el.get_text(strip=True)
                if not name or len(name) < 2:
                    continue

                # Phone (JustDial masks phones by default; extract visible portion)
                phone = None
                phone_el = item.select_one(
                    "a[href^='tel:'], p.contact-info, span[class*='phone'], .mobilesv"
                )
                if phone_el:
                    phone = phone_el.get_text(strip=True)
                    if not phone:
                        phone = phone_el.get("href", "").replace("tel:", "")
                # Clean phone
                if phone:
                    phone = re.sub(r"[^\d\+]", "", phone)
                    if len(phone) < 7:
                        phone = None

                # Address
                addr_el = item.select_one(
                    "p.store-address, span.address, p[class*='addr'], .resultbox_address"
                )
                address = addr_el.get_text(strip=True) if addr_el else None

                # Rating
                rating = None
                rating_el = item.select_one(
                    "span.green-rating, span[class*='rating'], .jd-rating span"
                )
                if rating_el:
                    try:
                        rating = float(rating_el.get_text(strip=True).split("/")[0])
                    except (ValueError, AttributeError):
                        pass

                # Website
                website = None
                website_el = item.select_one("a[href*='http']:not([href*='justdial'])")
                if website_el:
                    website = website_el.get("href")

                # Category
                cat_el = item.select_one("span[class*='category'], p.cat-info")
                category = cat_el.get_text(strip=True) if cat_el else industry

                results.append(
                    self._make_business_dict(
                        business_name=name,
                        industry=category or industry,
                        location=location,
                        city=location,
                        address=address,
                        phone=phone,
                        website=website,
                        rating=rating,
                        raw_payload={
                            "source_type": "justdial",
                            "industry": industry,
                            "location": location,
                        },
                    )
                )
            except Exception as e:
                logger.debug("Error parsing JustDial listing", error=str(e))
                continue

        return results
