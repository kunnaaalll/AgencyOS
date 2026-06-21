"""
Enrichment Service — Expanded website intelligence extraction.

Discovers automatically from business website:
  - Instagram URL
  - Facebook URL
  - LinkedIn URL
  - YouTube URL
  - Email addresses
  - Meta title
  - Meta description
  - Favicon URL
  - Analytics scripts (GA, GTM, Hotjar, etc.)
"""

import re
import structlog
from datetime import datetime, UTC
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup
from httpx import AsyncClient, TimeoutException

logger = structlog.get_logger()

# Social profile patterns (regex on href attributes)
SOCIAL_PATTERNS: dict[str, re.Pattern] = {
    "instagram_url": re.compile(
        r"instagram\.com/(?!p/|reel/|explore/|accounts/)([a-zA-Z0-9._]+)/?", re.IGNORECASE
    ),
    "facebook_url": re.compile(
        r"facebook\.com/(?!sharer|share|plugins|dialog/)([a-zA-Z0-9._\-]+)/?", re.IGNORECASE
    ),
    "linkedin_url": re.compile(
        r"linkedin\.com/(?:company|in|organization)/([a-zA-Z0-9._\-]+)/?", re.IGNORECASE
    ),
    "youtube_url": re.compile(
        r"youtube\.com/(?:channel|user|c|@)([a-zA-Z0-9._\-]+)/?", re.IGNORECASE
    ),
}

# Email extraction
EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")

# Analytics script detectors
ANALYTICS_SIGNATURES = {
    "google_analytics": ["googletagmanager.com/gtag", "google-analytics.com/analytics"],
    "google_tag_manager": ["googletagmanager.com/gtm"],
    "hotjar": ["static.hotjar.com"],
    "facebook_pixel": ["connect.facebook.net/en_US/fbevents"],
    "mixpanel": ["cdn.mxpnl.com", "cdn4.mxpnl.com"],
    "hubspot": ["hs-scripts.com", "hscollectedforms.net"],
    "intercom": ["widget.intercom.io"],
    "crisp": ["client.crisp.chat"],
    "tawk": ["embed.tawk.to"],
    "clarity": ["clarity.ms"],
}

# Pages to check for contact info
CONTACT_PATHS = ["/contact", "/contact-us", "/about", "/about-us", "/reach-us"]


class EnrichmentService:
    @staticmethod
    async def enrich_business(business: dict) -> dict:
        """
        Enrich a business dict with website intelligence.
        Updates: social URLs, email, meta_title, meta_description,
                 favicon, analytics scripts, enriched_at timestamp.
        """
        website = business.get("website")
        if not website:
            return business

        if not website.startswith("http"):
            website = f"https://{website}"

        # Store normalized website
        business["website"] = website

        try:
            async with AsyncClient(
                timeout=10.0,
                follow_redirects=True,
                headers={
                    "User-Agent": "Mozilla/5.0 (compatible; AgencyOS/2.1; +https://agencyos.io)",
                    "Accept": "text/html,application/xhtml+xml,*/*",
                    "Accept-Language": "en-IN,en;q=0.9",
                },
            ) as client:
                # Fetch homepage
                try:
                    resp = await client.get(website, timeout=10.0)
                    if resp.status_code == 200:
                        soup = BeautifulSoup(resp.text, "html.parser")
                        business = EnrichmentService._parse_homepage(business, soup, website)

                        # Try to find more emails on contact page
                        if not business.get("email"):
                            for path in CONTACT_PATHS:
                                contact_url = urljoin(website, path)
                                try:
                                    contact_resp = await client.get(contact_url, timeout=5.0)
                                    if contact_resp.status_code == 200:
                                        contact_soup = BeautifulSoup(contact_resp.text, "html.parser")
                                        email = EnrichmentService._extract_email(contact_soup)
                                        if email:
                                            business["email"] = email
                                            break
                                except Exception:
                                    pass
                except TimeoutException:
                    logger.debug("Enrichment timeout", website=website)
                except Exception as e:
                    logger.debug("Enrichment fetch error", website=website, error=str(e))

        except Exception as e:
            logger.warning("Enrichment error", website=website, error=str(e))

        # Set enrichment timestamp
        business["enriched_at"] = datetime.now(UTC).isoformat()

        return business

    @staticmethod
    def _parse_homepage(business: dict, soup: BeautifulSoup, base_url: str) -> dict:
        """Extract all intelligence from homepage HTML."""
        payload = dict(business.get("raw_payload") or {})

        # Meta title
        if soup.title and soup.title.string:
            title = soup.title.string.strip()[:500]
            business["meta_title"] = title
            payload["website_title"] = title

        # Meta description
        meta_desc = (
            soup.find("meta", attrs={"name": "description"})
            or soup.find("meta", attrs={"property": "og:description"})
        )
        if meta_desc and meta_desc.get("content"):
            desc = meta_desc["content"].strip()
            business["meta_description"] = desc[:1000]
            payload["meta_description"] = desc

        # Favicon
        icon = (
            soup.find("link", rel="icon")
            or soup.find("link", rel="shortcut icon")
            or soup.find("link", rel="apple-touch-icon")
        )
        if icon and icon.get("href"):
            favicon = urljoin(base_url, icon["href"])
            payload["favicon"] = favicon

        # Domain
        parsed = urlparse(base_url)
        payload["domain"] = parsed.netloc.replace("www.", "")

        # Social links — scan all anchor hrefs
        all_links = [a.get("href", "") for a in soup.find_all("a", href=True)]
        all_text = " ".join(all_links) + " " + str(soup)

        for field, pattern in SOCIAL_PATTERNS.items():
            if business.get(field):
                continue  # Already known
            match = pattern.search(all_text)
            if match:
                full_url = match.group(0)
                if not full_url.startswith("http"):
                    full_url = f"https://{full_url}"
                business[field] = full_url.rstrip("/")

        # Email
        if not business.get("email"):
            email = EnrichmentService._extract_email(soup)
            if email:
                business["email"] = email

        # Analytics detection
        scripts_text = " ".join(
            s.get("src", "") + (s.string or "")
            for s in soup.find_all("script")
        )
        detected_analytics = []
        for tool, signatures in ANALYTICS_SIGNATURES.items():
            if any(sig in scripts_text for sig in signatures):
                detected_analytics.append(tool)
        if detected_analytics:
            payload["analytics"] = detected_analytics

        # Tech stack hints
        meta_generator = soup.find("meta", attrs={"name": "generator"})
        if meta_generator and meta_generator.get("content"):
            payload["generator"] = meta_generator["content"]

        business["raw_payload"] = payload
        return business

    @staticmethod
    def _extract_email(soup: BeautifulSoup) -> str | None:
        """Extract first valid email from page."""
        # Check mailto: links first (most reliable)
        for a in soup.find_all("a", href=re.compile(r"^mailto:")):
            email = a["href"].replace("mailto:", "").split("?")[0].strip()
            if EMAIL_PATTERN.match(email):
                return email

        # Scan page text
        text = soup.get_text()
        matches = EMAIL_PATTERN.findall(text)
        skip_domains = {"example.com", "test.com", "email.com", "yourdomain.com"}
        for email in matches:
            domain = email.split("@")[-1].lower()
            if domain not in skip_domains and not domain.endswith(".png"):
                return email

        return None
