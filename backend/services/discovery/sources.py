from abc import ABC, abstractmethod
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS
from playwright.async_api import async_playwright

class DiscoverySource(ABC):
    @abstractmethod
    async def discover(self, query: str, location: str, limit: int) -> list[dict]:
        """
        Discover businesses based on query and location.
        Returns a list of raw business dictionaries.
        """
        pass

class GoogleMapsSource(DiscoverySource):
    async def discover(self, query: str, location: str, limit: int) -> list[dict]:
        results = []
        search_query = f"{query} in {location}"
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            # Simple mock integration for Google Maps using Playwright
            # In a real scenario, this would navigate to maps.google.com and scrape results.
            # Due to CAPTCHAs and structural changes, this provides a structural skeleton.
            await page.goto(f"https://duckduckgo.com/?q={search_query.replace(' ', '+')}+site:maps.google.com")
            await page.wait_for_timeout(2000)
            
            content = await page.content()
            soup = BeautifulSoup(content, "html.parser")
            
            # Simulated extraction
            # This is a structural representation of what would be extracted
            for _ in range(min(limit, 5)):
                results.append({
                    "business_name": f"Extracted Business from Google Maps - {search_query}",
                    "website": "https://example.com",
                    "phone": "+1-555-0100",
                    "address": location,
                    "city": location.split(',')[0] if ',' in location else location,
                    "state": "",
                    "country": "",
                    "industry": query,
                    "google_maps_url": "https://maps.google.com/?q=...",
                    "raw_payload": {"source_type": "google_maps", "query": search_query}
                })
                
            await browser.close()
            
        return results

class GoogleSearchSource(DiscoverySource):
    async def discover(self, query: str, location: str, limit: int) -> list[dict]:
        results = []
        search_query = f"{query} businesses in {location}"
        
        with DDGS() as ddgs:
            ddg_results = ddgs.text(search_query, max_results=limit)
            for res in ddg_results:
                results.append({
                    "business_name": res.get("title", ""),
                    "website": res.get("href", ""),
                    "phone": None,
                    "address": location,
                    "city": location.split(',')[0] if ',' in location else location,
                    "state": "",
                    "country": "",
                    "industry": query,
                    "google_maps_url": None,
                    "raw_payload": res
                })
        return results

class RedditSource(DiscoverySource):
    async def discover(self, query: str, location: str, limit: int) -> list[dict]:
        results = []
        subreddits = ["mumbai", "india", "smallbusiness", "startups"]
        search_query = f"{query} {location}"
        
        with DDGS() as ddgs:
            for sub in subreddits:
                ddg_query = f"site:reddit.com/r/{sub} {search_query}"
                ddg_results = ddgs.text(ddg_query, max_results=max(1, limit // len(subreddits)))
                for res in ddg_results:
                    results.append({
                        "business_name": res.get("title", f"Business from r/{sub}"),
                        "website": res.get("href", ""),
                        "phone": None,
                        "address": location,
                        "city": location.split(',')[0] if ',' in location else location,
                        "state": "",
                        "country": "",
                        "industry": query,
                        "google_maps_url": None,
                        "raw_payload": res
                    })
        return results
