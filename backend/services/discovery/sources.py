from abc import ABC, abstractmethod

from crawl4ai import AsyncWebCrawler
from duckduckgo_search import DDGS


class DiscoverySource(ABC):
    @abstractmethod
    async def discover(self, query: str, location: str, limit: int) -> list[dict]:
        """
        Discover businesses based on query and location.
        Returns a list of raw business dictionaries.
        """
        pass

class Crawl4AISource(DiscoverySource):
    async def discover(self, query: str, location: str, limit: int) -> list[dict]:
        results = []
        search_query = f"{query} businesses in {location}"

        # 1. Use DDGS to find target URLs
        urls_to_scrape = []
        with DDGS() as ddgs:
            ddg_results = ddgs.text(search_query, max_results=limit)
            for res in ddg_results:
                if res.get("href"):
                    urls_to_scrape.append({
                        "url": res["href"],
                        "title": res.get("title", ""),
                        "search_snippet": res.get("body", "")
                    })

        # 2. Use Crawl4AI to scrape the sites for deep context
        async with AsyncWebCrawler(verbose=True) as crawler:
            for item in urls_to_scrape:
                try:
                    crawl_result = await crawler.arun(url=item["url"])

                    # Extract raw markdown which is perfect for LLM parsing downstream
                    markdown_content = crawl_result.markdown

                    results.append({
                        "business_name": item["title"],
                        "website": item["url"],
                        "phone": None, # Could be parsed via regex or LLM downstream
                        "address": location,
                        "city": location.split(',')[0] if ',' in location else location,
                        "state": "",
                        "country": "",
                        "industry": query,
                        "google_maps_url": None,
                        "raw_payload": {
                            "source_type": "crawl4ai_web",
                            "search_snippet": item["search_snippet"],
                            "markdown": markdown_content[:5000] # Limit size for payload safety
                        }
                    })
                except Exception as e:
                    print(f"Failed to crawl {item['url']}: {e}")
                    # Still append basic info even if scrape fails
                    results.append({
                        "business_name": item["title"],
                        "website": item["url"],
                        "phone": None,
                        "address": location,
                        "city": location.split(',')[0] if ',' in location else location,
                        "state": "",
                        "country": "",
                        "industry": query,
                        "google_maps_url": None,
                        "raw_payload": {
                            "source_type": "crawl4ai_failed",
                            "search_snippet": item["search_snippet"]
                        }
                    })

        return results

# Keep simple DDG Search for very fast non-scraping fallback
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
