from bs4 import BeautifulSoup
from httpx import AsyncClient

class EnrichmentService:
    @staticmethod
    async def enrich_business(business: dict) -> dict:
        """
        Enriches business data with:
        - website title
        - meta description
        - social links
        - domain
        - favicon
        """
        website = business.get("website")
        if not website:
            return business
            
        if not website.startswith("http"):
            website = f"https://{website}"
            
        try:
            async with AsyncClient(timeout=5.0) as client:
                resp = await client.get(website)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    
                    # Title
                    if soup.title:
                        business["raw_payload"]["website_title"] = soup.title.string
                        
                    # Meta Description
                    meta_desc = soup.find("meta", attrs={"name": "description"})
                    if meta_desc:
                        business["raw_payload"]["meta_description"] = meta_desc.get("content")
                        
                    # Favicon
                    icon = soup.find("link", rel="icon") or soup.find("link", rel="shortcut icon")
                    if icon:
                        business["raw_payload"]["favicon"] = icon.get("href")
                        
                    # Social Links
                    social_links = []
                    for a in soup.find_all("a", href=True):
                        href = a["href"]
                        if any(social in href for social in ["facebook.com", "twitter.com", "linkedin.com", "instagram.com"]):
                            social_links.append(href)
                    if social_links:
                        business["raw_payload"]["social_links"] = list(set(social_links))
                        
                    # Domain
                    business["raw_payload"]["domain"] = website.split("//")[-1].split("/")[0]
                    
        except Exception:
            pass
            
        return business
