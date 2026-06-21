"""
IndiaMart Discovery Source — Playwright-based scraper for dir.indiamart.com.

IndiaMart hosts manufacturers, service providers, and agencies.
URL pattern: https://dir.indiamart.com/search.mp?ss={industry}&prdsrc=1

Extracts: business name, phone, website, category, address.
"""

import re
import asyncio
import structlog
from bs4 import BeautifulSoup
from urllib.parse import quote

from domain.discovery.sources.base import BaseDiscoverySource
from utils.browser_pool import get_browser_pool

logger = structlog.get_logger()

INDIAMART_SEARCH = "https://dir.indiamart.com/search.mp"


class IndiaMartSource(BaseDiscoverySource):
    source_name = "indiamart"

    async def _discover(self, industry: str, location: str, limit: int) -> list[dict]:
        pool = get_browser_pool()
        results: list[dict] = []

        # Build search URL
        query = f"{industry} {location}"
        url = f"{INDIAMART_SEARCH}?ss={quote(query)}&prdsrc=1"

        logger.debug("IndiaMart search", url=url)

        async with pool.acquire_context() as (page, context):
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                await self._random_delay()

                # Handle any overlays
                for selector in ['button:has-text("Close")', '.popup-close', "#onetrust-accept-btn-handler"]:
                    try:
                        btn = page.locator(selector).first
                        if await btn.is_visible(timeout=2000):
                            await btn.click()
                            await asyncio.sleep(0.5)
                    except Exception:
                        pass

                # Wait for listing results
                try:
                    await page.wait_for_selector(
                        'div.producttitle, div[class*="supplier"], li.lst-Unit',
                        timeout=15000,
                    )
                except Exception:
                    pass

                # Scroll for more results
                for _ in range(min(4, limit // 10 + 1)):
                    await page.evaluate("window.scrollBy(0, 2000)")
                    await asyncio.sleep(1.0)

                content = await page.content()
                results = self._parse_results(content, industry, location, limit)

            except Exception as e:
                logger.error("IndiaMart scraping error", error=str(e))

        return results

    def _parse_results(self, html: str, industry: str, location: str, limit: int) -> list[dict]:
        soup = BeautifulSoup(html, "html.parser")
        results = []

        # Multiple selector patterns for IndiaMart's varied layouts
        containers = (
            soup.select("div.brd div.supplierProfile")
            or soup.select("li.lst-Unit")
            or soup.select("div[class*='supplier-card']")
            or soup.select("div.producttitle")
        )

        for item in containers[:limit]:
            try:
                # Company name
                name_el = (
                    item.select_one("h2.producttitle a")
                    or item.select_one("a.supplierName")
                    or item.select_one("div.supplierName a")
                    or item.select_one("p.companyname a")
                    or item.select_one("h3 a")
                )
                if not name_el:
                    continue
                name = name_el.get_text(strip=True)
                if not name:
                    continue

                # Phone
                phone_el = (
                    item.select_one("a[href^='tel:']")
                    or item.select_one("span[class*='phone']")
                    or item.select_one("div.contact-info")
                )
                phone = None
                if phone_el:
                    phone_raw = phone_el.get("href", "") or phone_el.get_text(strip=True)
                    phone = phone_raw.replace("tel:", "").strip()
                    phone = re.sub(r"[^\d\+\-\s]", "", phone).strip()
                    if len(phone) < 7:
                        phone = None

                # Website
                website = None
                site_el = item.select_one("a[href*='http']:not([href*='indiamart.com'])")
                if site_el:
                    website = site_el.get("href")

                # Address / location
                addr_el = (
                    item.select_one("span[class*='address']")
                    or item.select_one("div.supplierAddress")
                    or item.select_one("p.supplieraddress")
                )
                address = addr_el.get_text(strip=True) if addr_el else None

                # Category
                cat_el = item.select_one("span[class*='category'], p.brdCrs")
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
                        raw_payload={
                            "source_type": "indiamart",
                            "industry": industry,
                            "location": location,
                        },
                    )
                )
            except Exception as e:
                logger.debug("Error parsing IndiaMart item", error=str(e))
                continue

        return results
