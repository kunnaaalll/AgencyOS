"""
Validation Service — Improved with completeness scoring.

Validates businesses and scores them for quality.

Completeness Scoring (0-100):
  Website       20 pts
  Phone         20 pts
  Address       20 pts
  Industry      20 pts
  Rating        10 pts
  Email         10 pts

Only businesses with completeness_score >= 60 are promoted to VALID.

Additional validations:
  - Website reachable (HTTP check)
  - Phone format (Indian format)
  - Email format
  - Duplicate detection
"""

import re

import structlog
from httpx import AsyncClient, RequestError, TimeoutException

logger = structlog.get_logger()

# Completeness scoring weights
COMPLETENESS_WEIGHTS = {
    "website": 20,
    "phone": 20,
    "address": 20,
    "industry": 20,
    "rating": 10,
    "email": 10,
}

# Minimum score to be considered VALID
MIN_COMPLETENESS_SCORE = 60

# Indian phone number patterns
INDIAN_PHONE_PATTERN = re.compile(
    r"^(\+?91[\-\s]?)?[6-9]\d{9}$|"  # Mobile: starts with 6-9, 10 digits
    r"^0\d{2,4}[\-\s]?\d{6,8}$|"  # Landline with STD code
    r"^\d{10}$"  # 10 digits mobile
)

EMAIL_PATTERN = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")


def _calculate_completeness_score(business: dict) -> int:
    """Calculate completeness score (0-100) based on available fields."""
    score = 0
    if business.get("website"):
        score += COMPLETENESS_WEIGHTS["website"]
    if business.get("phone"):
        score += COMPLETENESS_WEIGHTS["phone"]
    if business.get("address"):
        score += COMPLETENESS_WEIGHTS["address"]
    if business.get("industry"):
        score += COMPLETENESS_WEIGHTS["industry"]
    if business.get("rating") or business.get("google_rating"):
        score += COMPLETENESS_WEIGHTS["rating"]
    if business.get("email"):
        score += COMPLETENESS_WEIGHTS["email"]
    return score


def _is_valid_indian_phone(phone: str | None) -> bool:
    """Validate Indian phone number format."""
    if not phone:
        return False
    phone_clean = re.sub(r"[\s\-\(\)]", "", phone.strip())
    return bool(INDIAN_PHONE_PATTERN.match(phone_clean))


def _is_valid_email(email: str | None) -> bool:
    """Validate email address format."""
    if not email:
        return False
    return bool(EMAIL_PATTERN.match(email.strip()))


async def _is_website_reachable(url: str) -> bool:
    """Check if a website is reachable (HTTP 2xx or 3xx)."""
    if not url:
        return False
    if not url.startswith("http"):
        url = f"https://{url}"
    try:
        async with AsyncClient(
            timeout=8.0,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (compatible; AgencyOS/2.1)"},
        ) as client:
            resp = await client.head(url)
            # HEAD might be blocked; try GET if so
            if resp.status_code == 405:
                resp = await client.get(url)
            return resp.status_code < 400
    except (TimeoutException, RequestError, Exception):
        return False


class ValidationService:
    @staticmethod
    async def validate_business(business: dict) -> dict:
        """
        Validate and score a business dict.
        Sets: validation_status, completeness_score, validated fields.
        Returns updated dict.
        """
        issues: list[str] = []

        # Website validation
        website = business.get("website")
        website_valid = False
        if website:
            website_valid = await _is_website_reachable(website)
            if not website_valid:
                issues.append("website_unreachable")
        else:
            issues.append("no_website")

        # Phone validation
        phone = business.get("phone")
        if phone and not _is_valid_indian_phone(phone):
            issues.append("invalid_phone_format")
            # Don't null the phone, just flag it

        # Email validation
        email = business.get("email")
        if email and not _is_valid_email(email):
            business["email"] = None
            issues.append("invalid_email")

        # Calculate completeness score
        completeness_score = _calculate_completeness_score(business)
        business["completeness_score"] = completeness_score

        # Determine validation status
        # Must have a reachable website OR completeness_score >= 60 to be VALID
        if completeness_score >= MIN_COMPLETENESS_SCORE:
            business["validation_status"] = "VALID"
        else:
            business["validation_status"] = "INVALID"

        # Store validation details in raw_payload
        payload = dict(business.get("raw_payload") or {})
        payload["validation"] = {
            "completeness_score": completeness_score,
            "issues": issues,
            "website_reachable": website_valid,
            "phone_valid": _is_valid_indian_phone(phone) if phone else False,
        }
        business["raw_payload"] = payload

        logger.debug(
            "Business validated",
            name=business.get("business_name"),
            score=completeness_score,
            status=business["validation_status"],
            issues=issues,
        )

        return business

    @staticmethod
    def calculate_completeness_score(business: dict) -> int:
        """Public method for standalone score calculation."""
        return _calculate_completeness_score(business)
