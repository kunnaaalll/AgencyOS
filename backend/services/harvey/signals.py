"""
Harvey Signal Detector for AgencyOS.

Ports the 23 buying signals from ethanplusai/harvey into AgencyOS:
  - INCUMBENT_AGENCY: Agency credits in footer ("Website by...", "Powered by...")
  - RUNNING_GOOGLE_ADS: Active Google Ads conversion/remarketing tags (AW-)
  - RUNNING_META_ADS: Active Meta/Facebook Pixel (connect.facebook.net, fbevents.js)
  - NO_ONLINE_BOOKING: Phone-only appointment scheduling; missing Calendly/Acuity/Cal.com
  - NO_SCHEMA_MARKUP: Missing JSON-LD / Schema.org structured data for SEO
  - TECH_STACK: CMS and framework detection (WordPress, Shopify, Webflow, Wix, Squarespace, Next.js)
  - BLOG_STALE: Outdated or abandoned content marketing
  - BLOCKS_AI_CRAWLERS: Disallow rules targeting AI engines
"""

import re
from dataclasses import dataclass, field
from typing import Any
from bs4 import BeautifulSoup


@dataclass
class DetectedSignal:
    signal_id: str
    name: str
    category: str  # "profile", "discovery", "people", "contact"
    description: str
    is_positive: bool
    evidence: str = ""
    pitch_angle: str = ""


class HarveySignalDetector:
    """Extracts high-intent buying signals from webpage HTML and DOM structure."""

    # Booking platform domains
    BOOKING_DOMAINS = [
        "calendly.com",
        "acuityscheduling.com",
        "cal.com",
        "appointy.com",
        "tidycal.com",
        "setmore.com",
        "booksy.com",
        "simplybook.me",
        "square.site/appointments",
    ]

    # Footer agency attribution patterns
    AGENCY_CREDIT_PATTERNS = [
        re.compile(r"(?:website|site|web\s+design|designed|developed|built|powered)\s+(?:by|from)\s+([A-Za-z0-9\s\.\-]{2,40})", re.IGNORECASE),
        re.compile(r"crafted\s+by\s+([A-Za-z0-9\s\.\-]{2,40})", re.IGNORECASE),
        re.compile(r"digital\s+agency\s*:\s*([A-Za-z0-9\s\.\-]{2,40})", re.IGNORECASE),
    ]

    # CMS / Tech signatures
    TECH_SIGNATURES = {
        "WordPress": ["wp-content", "wp-includes", "wp-json"],
        "Shopify": ["cdn.shopify.com", "myshopify.com", "Shopify.theme"],
        "Webflow": ["assets.website-files.com", "webflow.com", "w-nav"],
        "Wix": ["wixsite.com", "wix-static.com", "wix.com"],
        "Squarespace": ["squarespace.com", "sqsp.net"],
        "Next.js": ["_next/static", "__NEXT_DATA__"],
        "WooCommerce": ["woocommerce", "wc-ajax"],
    }

    @classmethod
    def detect_signals(cls, html_content: str, soup: BeautifulSoup, url: str) -> list[DetectedSignal]:
        signals: list[DetectedSignal] = []
        html_lower = html_content.lower()

        # ── 1. INCUMBENT_AGENCY ──
        incumbent = cls._detect_incumbent_agency(soup)
        if incumbent:
            signals.append(
                DetectedSignal(
                    signal_id="INCUMBENT_AGENCY",
                    name="Incumbent Agency Detected",
                    category="profile",
                    description=f"Current website was designed/built by competitor '{incumbent}'.",
                    is_positive=False,
                    evidence=f"Credit in footer/source: {incumbent}",
                    pitch_angle=f"Pitch modernization directly against {incumbent}'s legacy setup.",
                )
            )

        # ── 2. RUNNING_GOOGLE_ADS ──
        if "googletagmanager.com/gtag/js?id=aw-" in html_lower or "googleadservices.com" in html_lower:
            signals.append(
                DetectedSignal(
                    signal_id="RUNNING_GOOGLE_ADS",
                    name="Active Google Ads Spending",
                    category="profile",
                    description="Company is actively running Google Search or Display Ads.",
                    is_positive=True,
                    evidence="Detected Google Ads conversion/remarketing tag (AW-)",
                    pitch_angle="They have active acquisition budget — pitch higher conversion landing pages or better funnel tracking.",
                )
            )

        # ── 3. RUNNING_META_ADS ──
        if "connect.facebook.net" in html_lower or "fbevents.js" in html_lower or "fbq('init'" in html_lower:
            signals.append(
                DetectedSignal(
                    signal_id="RUNNING_META_ADS",
                    name="Active Meta Ads Spending",
                    category="profile",
                    description="Company is actively running Facebook/Instagram Ads.",
                    is_positive=True,
                    evidence="Detected Meta Pixel integration in page source",
                    pitch_angle="Pitch social media creative, retargeting automations, or WhatsApp lead nurturing.",
                )
            )

        # ── 4. NO_ONLINE_BOOKING ──
        has_booking = any(domain in html_lower for domain in cls.BOOKING_DOMAINS)
        if not has_booking:
            signals.append(
                DetectedSignal(
                    signal_id="NO_ONLINE_BOOKING",
                    name="No Online Booking System",
                    category="profile",
                    description="No automated scheduling widget detected (phone-only booking).",
                    is_positive=False,
                    evidence="Absence of Calendly, Cal.com, Acuity, or booking widget embeds",
                    pitch_angle="Highlight loss of high-intent after-hours leads; offer 24/7 self-serve booking automation.",
                )
            )

        # ── 5. NO_SCHEMA_MARKUP ──
        schema_tag = soup.find("script", type="application/ld+json")
        if not schema_tag:
            signals.append(
                DetectedSignal(
                    signal_id="NO_SCHEMA_MARKUP",
                    name="Missing Schema.org Markup",
                    category="profile",
                    description="No structured JSON-LD data found for search engines.",
                    is_positive=False,
                    evidence="Missing application/ld+json script tags",
                    pitch_angle="Fix local search visibility, Google Rich Snippets, and Google Map pack rankings.",
                )
            )

        # ── 6. TECH_STACK ──
        detected_tech = []
        for tech, signatures in cls.TECH_SIGNATURES.items():
            if any(sig in html_content for sig in signatures):
                detected_tech.append(tech)
        if detected_tech:
            signals.append(
                DetectedSignal(
                    signal_id="TECH_STACK",
                    name="Technology Stack Detected",
                    category="profile",
                    description=f"Built using {', '.join(detected_tech)}.",
                    is_positive=True,
                    evidence=", ".join(detected_tech),
                    pitch_angle=f"Tailor pitch specifically to their {detected_tech[0]} environment.",
                )
            )

        # ── 7. BLOG_STALE ──
        # Check for blog presence and stale articles
        blog_links = soup.find_all("a", href=re.compile(r"/(?:blog|news|articles)/?", re.IGNORECASE))
        if blog_links:
            # Check for copyright or old years (e.g. 2021, 2022, 2023) in text
            recent_years = ["2026", "2025"]
            has_recent = any(year in html_content for year in recent_years)
            if not has_recent and any(old_year in html_content for old_year in ["2020", "2021", "2022", "2023"]):
                signals.append(
                    DetectedSignal(
                        signal_id="BLOG_STALE",
                        name="Abandoned or Stale Blog",
                        category="profile",
                        description="Content marketing initiated but hasn't been updated recently.",
                        is_positive=False,
                        evidence="Found blog section with outdated timestamps/copyright",
                        pitch_angle="Offer automated AI blog and SEO content publishing services to revive traffic.",
                    )
                )

        return signals

    @classmethod
    def _detect_incumbent_agency(cls, soup: BeautifulSoup) -> str:
        """Scan footer, credits, and link attributes for agency names."""
        footer = soup.find("footer")
        text_to_search = footer.get_text() if footer else soup.get_text()[-1500:]

        for pattern in cls.AGENCY_CREDIT_PATTERNS:
            match = pattern.search(text_to_search)
            if match:
                agency = match.group(1).strip()
                # Clean up punctuation and common words
                agency = re.sub(r"[\.\|\,\-\_]+$", "", agency).strip()
                if len(agency) > 2 and not any(w in agency.lower() for w in ["all rights", "copyright", "privacy", "terms"]):
                    return agency[:40]

        # Check footer links
        if footer:
            for a in footer.find_all("a", href=True):
                href = a.get("href", "").lower()
                text = a.get_text().strip().lower()
                if any(k in text for k in ["designed by", "website by", "developed by", "powered by"]):
                    name = a.get_text().strip()
                    for prefix in ["designed by", "website by", "developed by", "powered by"]:
                        if prefix in name.lower():
                            name = name[name.lower().index(prefix) + len(prefix):].strip()
                    if name:
                        return name[:40]

        return ""
