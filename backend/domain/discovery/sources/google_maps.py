"""
Google Maps Discovery Source — Real Playwright-based scraper.

Strategy:
  1. Navigate to Google Maps search for "{industry} {location}"
  2. Wait for business listing panel to load
  3. Scroll through results until limit reached or no new cards
  4. For each card, extract summary data
  5. Click each card to get detail panel (phone, website, hours)
  6. Return structured business dicts

Anti-blocking: randomized delays, stealth context, mouse movement simulation.
"""

import asyncio
import re

import structlog
from bs4 import BeautifulSoup

from domain.discovery.sources.base import BaseDiscoverySource
from utils.browser_pool import get_browser_pool

logger = structlog.get_logger()

MAPS_BASE = "https://www.google.com/maps/search/"
MAX_SCROLL_ATTEMPTS = 30


class GoogleMapsSource(BaseDiscoverySource):
    source_name = "google_maps"

    async def _discover(self, industry: str, location: str, limit: int) -> list[dict]:
        pool = get_browser_pool()
        results: list[dict] = []

        search_query = f"{industry} {location}"
        url = f"{MAPS_BASE}{search_query.replace(' ', '+')}"

        async with pool.acquire_context() as (page, context):
            try:
                # Navigate to Google Maps search
                await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                await self._random_delay()

                # Accept cookies if prompted
                try:
                    accept_btn = page.locator('button:has-text("Accept all")').first
                    if await accept_btn.is_visible(timeout=3000):
                        await accept_btn.click()
                        await asyncio.sleep(1)
                except Exception:
                    pass

                # Wait for results panel
                await page.wait_for_selector('[role="feed"]', timeout=15000)

                # Scroll to load results
                collected_hrefs: set[str] = set()
                scroll_attempts = 0
                prev_count = 0

                while len(collected_hrefs) < limit and scroll_attempts < MAX_SCROLL_ATTEMPTS:
                    # Get all result links currently visible
                    cards = await page.query_selector_all('a[href*="/maps/place/"]')
                    for card in cards:
                        href = await card.get_attribute("href")
                        if href and "/maps/place/" in href:
                            collected_hrefs.add(href.split("?")[0])

                    if len(collected_hrefs) >= limit:
                        break

                    # Check if we've reached the end of results
                    end_marker = await page.query_selector('text="You\'ve reached the end of the list."')
                    if end_marker:
                        break

                    # Check if count didn't grow (stuck)
                    if len(collected_hrefs) == prev_count:
                        scroll_attempts += 1
                    else:
                        scroll_attempts = 0
                        prev_count = len(collected_hrefs)

                    # Scroll the feed panel
                    try:
                        feed = page.locator('[role="feed"]')
                        await feed.evaluate("el => el.scrollBy(0, 800)")
                        await asyncio.sleep(0.8)
                    except Exception:
                        break

                # Visit each result for details (up to limit)
                hrefs_to_visit = list(collected_hrefs)[:limit]
                logger.info("GoogleMaps: visiting details", count=len(hrefs_to_visit))

                for href in hrefs_to_visit:
                    try:
                        business = await self._extract_place_details(page, href, industry, location)
                        if business:
                            results.append(business)
                        await self._short_delay()
                    except Exception as e:
                        logger.warning("Failed to extract place details", url=href, error=str(e))

            except Exception as e:
                logger.error("GoogleMaps discovery error", error=str(e))

        return results

    async def _extract_place_details(
        self, page, maps_url: str, industry: str, location: str
    ) -> dict | None:
        """Navigate to a Google Maps place and extract all details."""
        try:
            await page.goto(maps_url, wait_until="domcontentloaded", timeout=20000)
            await asyncio.sleep(1.5)

            content = await page.content()
            soup = BeautifulSoup(content, "html.parser")

            # Business name — typically in h1
            name_el = soup.select_one("h1.DUwDvf, h1[class*='fontHeadlineLarge']")
            if not name_el:
                name_el = soup.select_one("h1")
            if not name_el:
                return None
            name = name_el.get_text(strip=True)
            if not name:
                return None

            # Category
            category_el = soup.select_one("button[jsaction*='pane.rating']")
            category = category_el.get_text(strip=True) if category_el else industry

            # Rating
            rating_el = soup.select_one("div.F7nice span[aria-hidden='true']")
            rating = None
            if rating_el:
                try:
                    rating = float(rating_el.get_text(strip=True))
                except (ValueError, AttributeError):
                    pass

            # Review count
            review_el = soup.select_one("div.F7nice span[aria-label*='review']")
            review_count = None
            if review_el:
                text = review_el.get("aria-label") or review_el.get_text()
                match = re.search(r"[\d,]+", text)
                if match:
                    try:
                        review_count = int(match.group().replace(",", ""))
                    except ValueError:
                        pass

            # Phone
            phone = None
            phone_btn = soup.select_one("button[data-item-id^='phone']")
            if phone_btn:
                phone = phone_btn.get("data-item-id", "").replace("phone:", "")
            if not phone:
                # Try aria-label pattern
                for btn in soup.select("button[aria-label*='phone'], button[aria-label*='Phone']"):
                    label = btn.get("aria-label", "")
                    match = re.search(r"[\+\d\s\-\(\)]{7,15}", label)
                    if match:
                        phone = match.group().strip()
                        break

            # Website
            website = None
            website_link = soup.select_one("a[data-item-id='authority']")
            if website_link:
                website = website_link.get("href")
            if not website:
                for a in soup.select("a[href*='http']"):
                    href = a.get("href", "")
                    if "google.com" not in href and "maps.google" not in href:
                        website = href
                        break

            # Address
            address_btn = soup.select_one("button[data-item-id='address']")
            address = address_btn.get_text(strip=True) if address_btn else None

            # Opening hours — try to find hours widget
            opening_hours: dict = {}
            hours_table = soup.select("tr.y0skZc")
            if hours_table:
                for row in hours_table:
                    day_el = row.select_one("td.ylH6lf")
                    time_el = row.select_one("td.mxowUb")
                    if day_el and time_el:
                        opening_hours[day_el.get_text(strip=True)] = time_el.get_text(strip=True)

            # Parse city from address
            city = location
            if address:
                parts = address.split(",")
                if len(parts) >= 2:
                    city = parts[-2].strip()

            return self._make_business_dict(
                business_name=name,
                industry=category or industry,
                location=location,
                city=city,
                address=address,
                website=website,
                phone=phone,
                rating=rating,
                google_rating=rating,
                review_count=review_count,
                google_maps_url=maps_url,
                opening_hours=opening_hours,
                raw_payload={
                    "source_type": "google_maps",
                    "maps_url": maps_url,
                    "category": category,
                },
            )

        except Exception as e:
            logger.warning("Error extracting place details", error=str(e))
            return None
