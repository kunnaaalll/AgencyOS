import logging
from uuid import UUID

import httpx
import trafilatura
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from sqlalchemy.ext.asyncio import AsyncSession

from domain.analysis.models import WebsiteAnalysis

logger = logging.getLogger(__name__)


class WebsiteAnalysisService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def analyze_website(self, lead_id: UUID, url: str) -> WebsiteAnalysis:
        logger.info(f"Analyzing website: {url} for lead {lead_id}")

        # Ensure url has scheme
        if not url.startswith("http"):
            url = f"https://{url}"

        # Setup base scores
        scores = {
            "website": 0,
            "seo": 0,
            "mobile": 0,
            "cta": 0,
            "social": 0,
            "digital_maturity": 0
        }

        strengths = []
        weaknesses = []
        pain_points = []

        html_content = ""
        is_https = url.startswith("https")
        if is_https:
            scores["website"] += 5
            strengths.append("Website uses HTTPS.")
        else:
            weaknesses.append("Website is not secure (HTTP).")
            pain_points.append("Potential trust issues due to lack of HTTPS.")

        # Playwright for rendering
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)

                # Desktop View
                context = await browser.new_context()
                page = await context.new_page()
                await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                html_content = await page.content()

                # Mobile View check
                mobile_context = await browser.new_context(
                    viewport={"width": 375, "height": 812},
                    is_mobile=True,
                    has_touch=True
                )
                mobile_page = await mobile_context.new_page()
                try:
                    await mobile_page.goto(url, wait_until="domcontentloaded", timeout=15000)
                    scores["mobile"] += 5  # Successfully rendered mobile
                    strengths.append("Website renders successfully on mobile.")
                except Exception:
                    weaknesses.append("Failed to render on mobile devices.")
                    pain_points.append("Loss of mobile traffic due to rendering issues.")

                await browser.close()
        except Exception as e:
            logger.error(f"Playwright error for {url}: {e}")
            # Fallback to httpx
            try:
                async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                    resp = await client.get(url)
                    html_content = resp.text
            except Exception as httpx_e:
                logger.error(f"HTTPX fallback failed for {url}: {httpx_e}")

        if not html_content:
            weaknesses.append("Could not fetch website content.")
            return WebsiteAnalysis(
                lead_id=lead_id,
                website_url=url,
                website_score=0,
                seo_score=0,
                mobile_score=0,
                cta_score=0,
                social_score=0,
                digital_maturity_score=0,
                overall_score=0,
                strengths=strengths,
                weaknesses=weaknesses,
                pain_points=pain_points
            )

        soup = BeautifulSoup(html_content, "html.parser")

        # ── Website Quality (0-20) ──
        # HTTPS +5 (already added)
        if soup.title and soup.title.string:
            scores["website"] += 5
        else:
            weaknesses.append("Missing page title.")

        if soup.find("meta", {"name": "description"}):
            scores["website"] += 5
        else:
            weaknesses.append("Missing meta description.")

        if soup.find("link", {"rel": lambda x: x and "icon" in x.lower()}):
            scores["website"] += 5

        # ── SEO Score (0-20) ──
        h1_tags = soup.find_all("h1")
        if h1_tags:
            scores["seo"] += 5
            if len(h1_tags) == 1:
                scores["seo"] += 5
        else:
            weaknesses.append("Missing H1 tag.")
            pain_points.append("Poor SEO visibility due to missing main heading.")

        if soup.find("meta", property="og:title") or soup.find("meta", property="og:image"):
            scores["seo"] += 5

        if soup.find("script", type="application/ld+json"):
            scores["seo"] += 5
            strengths.append("Uses structured data (Schema.org).")

        images = soup.find_all("img")
        missing_alts = sum(1 for img in images if not img.get("alt"))
        if images and missing_alts == 0:
            strengths.append("All images have alt tags.")
        elif missing_alts > 0:
            weaknesses.append(f"{missing_alts} images missing alt tags.")

        # ── Mobile Score (0-15) ──
        # Mobile rendering +5 (already added)
        viewport = soup.find("meta", {"name": "viewport"})
        if viewport and "width=device-width" in viewport.get("content", ""):
            scores["mobile"] += 10

        # ── CTA Score (0-15) ──
        text_content = soup.get_text().lower()
        has_cta = False
        if soup.find("form"):
            scores["cta"] += 5
            has_cta = True

        if "tel:" in html_content or "phone" in text_content:
            scores["cta"] += 5
            has_cta = True

        if "wa.me/" in html_content or "whatsapp" in text_content:
            scores["cta"] += 5
            has_cta = True

        if not has_cta:
            weaknesses.append("No clear call-to-action detected.")
            pain_points.append("Potential loss of leads due to missing inquiry options.")
        else:
            strengths.append("Good presence of contact/CTA elements.")

        # ── Social Presence (0-15) ──
        social_links = {
            "instagram": "instagram.com",
            "facebook": "facebook.com",
            "linkedin": "linkedin.com",
            "youtube": "youtube.com",
            "twitter": "twitter.com"
        }
        found_socials = 0
        for name, domain in social_links.items():
            if soup.find("a", href=lambda href: href and domain in href):
                found_socials += 1

        scores["social"] = min(15, found_socials * 3)
        if found_socials > 2:
            strengths.append("Strong social media presence.")
        elif found_socials == 0:
            weaknesses.append("No social media links found.")

        # ── Digital Maturity (0-15) ──
        if "google-analytics.com" in html_content or "gtag" in html_content:
            scores["digital_maturity"] += 5
            strengths.append("Analytics tracking is implemented.")

        if "intercom" in html_content or "drift.com" in html_content or "crisp.chat" in html_content:
            scores["digital_maturity"] += 5

        if "pixel" in html_content.lower() or "connect.facebook.net" in html_content:
            scores["digital_maturity"] += 5

        # ── Calculate Overall Score ──
        overall = sum(scores.values()) // len(scores)

        # Use Trafilatura for text extraction (insight generation)
        extracted_text = trafilatura.extract(html_content)
        if extracted_text and len(extracted_text) < 100:
            weaknesses.append("Very little readable text content on the page.")

        analysis = WebsiteAnalysis(
            lead_id=lead_id,
            website_url=url,
            website_score=scores["website"],
            seo_score=scores["seo"],
            mobile_score=scores["mobile"],
            cta_score=scores["cta"],
            social_score=scores["social"],
            digital_maturity_score=scores["digital_maturity"],
            overall_score=overall,
            strengths=strengths,
            weaknesses=weaknesses,
            pain_points=pain_points
        )

        return analysis
