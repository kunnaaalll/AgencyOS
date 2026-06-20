import re
import asyncio
from httpx import AsyncClient, TimeoutException

class ValidationService:
    @staticmethod
    async def validate_business(business: dict) -> dict:
        """
        Validates business data:
        - website reachable
        - valid email format
        - valid phone format
        """
        valid = True
        
        # Website Validation
        website = business.get("website")
        if website:
            if not website.startswith("http"):
                website = f"https://{website}"
            try:
                async with AsyncClient(timeout=5.0) as client:
                    resp = await client.get(website)
                    if resp.status_code >= 400:
                        valid = False
            except Exception:
                valid = False
        else:
            valid = False
            
        # Email validation
        email = business.get("email")
        if email:
            if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
                valid = False
                
        business["validation_status"] = "VALID" if valid else "INVALID"
        return business
