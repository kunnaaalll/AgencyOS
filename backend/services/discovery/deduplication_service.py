"""
Deduplication Service — Priority-based business deduplication.

Deduplication priority:
  1. Website (exact URL match after normalization)
  2. Phone (normalized 10-digit match)
  3. Google Maps URL
  4. Business Name + City (fuzzy match)

Merges best available data from both records when a duplicate is found.
"""

import re
import structlog
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from domain.discovery.models import RawBusiness
from domain.lead.models import Lead

logger = structlog.get_logger()


def _normalize_website(url: str | None) -> str | None:
    """Normalize URL for comparison: strip protocol, www, trailing slash."""
    if not url:
        return None
    url = url.lower().strip()
    url = re.sub(r"^https?://", "", url)
    url = re.sub(r"^www\.", "", url)
    url = url.rstrip("/")
    # Strip query params for comparison
    url = url.split("?")[0].split("#")[0]
    return url or None


def _normalize_phone(phone: str | None) -> str | None:
    """Normalize Indian phone number to 10 digits."""
    if not phone:
        return None
    digits = re.sub(r"\D", "", phone)
    # Strip country code
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    if digits.startswith("0") and len(digits) == 11:
        digits = digits[1:]
    if len(digits) == 10:
        return digits
    return None


def _name_city_key(name: str | None, city: str | None) -> str | None:
    """Create a normalized key from business name + city."""
    if not name:
        return None
    name_clean = re.sub(r"[^a-z0-9]", "", name.lower())
    city_clean = re.sub(r"[^a-z]", "", (city or "").lower())
    return f"{name_clean[:30]}:{city_clean[:15]}"


class DeduplicationService:
    """
    Checks if a business already exists in the database.
    Priority: website → phone → google_maps_url → name+city
    """

    @staticmethod
    async def is_duplicate(session: AsyncSession, business_dict: dict) -> bool:
        """
        Returns True if a duplicate already exists in raw_businesses.
        """
        # 1. Website match
        website = _normalize_website(business_dict.get("website"))
        if website:
            existing_lead = await session.execute(
                select(Lead).where(Lead.website.ilike(f"%{website}%")).limit(1)
            )
            if existing_lead.scalar_one_or_none():
                logger.debug("Duplicate found by website in Leads", website=website)
                return True

            existing = await session.execute(
                select(RawBusiness).where(
                    RawBusiness.is_duplicate.is_(False),
                ).where(
                    RawBusiness.website.ilike(f"%{website}%")
                ).limit(1)
            )
            if existing.scalar_one_or_none():
                logger.debug("Duplicate found by website", website=website)
                return True

        # 2. Phone match
        phone = _normalize_phone(business_dict.get("phone"))
        if phone:
            existing_lead = await session.execute(
                select(Lead).where(Lead.phone.ilike(f"%{phone}%")).limit(1)
            )
            if existing_lead.scalar_one_or_none():
                logger.debug("Duplicate found by phone in Leads", phone=phone)
                return True

            existing = await session.execute(
                select(RawBusiness).where(
                    RawBusiness.is_duplicate.is_(False),
                    RawBusiness.phone.ilike(f"%{phone}%"),
                ).limit(1)
            )
            if existing.scalar_one_or_none():
                logger.debug("Duplicate found by phone", phone=phone)
                return True

        # 3. Google Maps URL match
        maps_url = business_dict.get("google_maps_url")
        if maps_url:
            existing = await session.execute(
                select(RawBusiness).where(
                    RawBusiness.is_duplicate.is_(False),
                    RawBusiness.google_maps_url == maps_url,
                ).limit(1)
            )
            if existing.scalar_one_or_none():
                logger.debug("Duplicate found by google_maps_url")
                return True

        # 4. Name + City fuzzy match (exact normalized key)
        name = business_dict.get("business_name", "")
        city = business_dict.get("city", "")
        name_key = _name_city_key(name, city)
        if name_key:
            all_leads = await session.execute(
                select(Lead).where(
                    Lead.city.ilike(f"%{city}%") if city else True,
                ).limit(500)
            )
            for candidate in all_leads.scalars().all():
                candidate_key = _name_city_key(candidate.business_name, candidate.city)
                if candidate_key and candidate_key == name_key:
                    logger.debug("Duplicate found by name+city in Leads", name=name, city=city)
                    return True

            all_in_city = await session.execute(
                select(RawBusiness).where(
                    RawBusiness.is_duplicate.is_(False),
                    RawBusiness.city.ilike(f"%{city}%") if city else True,
                ).limit(500)
            )
            for candidate in all_in_city.scalars().all():
                candidate_key = _name_city_key(candidate.business_name, candidate.city)
                if candidate_key and candidate_key == name_key:
                    logger.debug("Duplicate found by name+city", name=name, city=city)
                    return True

        return False

    @staticmethod
    async def find_existing(session: AsyncSession, business_dict: dict) -> RawBusiness | None:
        """Find the existing record that matches the given business dict."""
        website = _normalize_website(business_dict.get("website"))
        if website:
            res = await session.execute(
                select(RawBusiness).where(RawBusiness.website.ilike(f"%{website}%")).limit(1)
            )
            existing = res.scalar_one_or_none()
            if existing:
                return existing

        phone = _normalize_phone(business_dict.get("phone"))
        if phone:
            res = await session.execute(
                select(RawBusiness).where(RawBusiness.phone.ilike(f"%{phone}%")).limit(1)
            )
            existing = res.scalar_one_or_none()
            if existing:
                return existing

        maps_url = business_dict.get("google_maps_url")
        if maps_url:
            res = await session.execute(
                select(RawBusiness).where(RawBusiness.google_maps_url == maps_url).limit(1)
            )
            existing = res.scalar_one_or_none()
            if existing:
                return existing

        return None

    @staticmethod
    def merge_duplicate(existing: RawBusiness, new_dict: dict) -> RawBusiness:
        """
        Merge best data from new_dict into existing record.
        Principle: fill gaps; never overwrite good existing data with null.
        """
        # Fill in missing fields from new discovery
        if not existing.website and new_dict.get("website"):
            existing.website = new_dict["website"]
        if not existing.phone and new_dict.get("phone"):
            existing.phone = new_dict["phone"]
        if not existing.email and new_dict.get("email"):
            existing.email = new_dict["email"]
        if not existing.address and new_dict.get("address"):
            existing.address = new_dict["address"]
        if not existing.rating and new_dict.get("rating"):
            existing.rating = new_dict["rating"]
        if not existing.google_rating and new_dict.get("google_rating"):
            existing.google_rating = new_dict["google_rating"]
        if not existing.review_count and new_dict.get("review_count"):
            existing.review_count = new_dict["review_count"]
        if not existing.google_maps_url and new_dict.get("google_maps_url"):
            existing.google_maps_url = new_dict["google_maps_url"]

        # Merge opening hours if missing
        if not existing.opening_hours and new_dict.get("opening_hours"):
            existing.opening_hours = new_dict["opening_hours"]

        # Merge raw payload
        if new_dict.get("raw_payload"):
            merged_payload = dict(existing.raw_payload or {})
            merged_payload.update(new_dict["raw_payload"])
            existing.raw_payload = merged_payload

        return existing
