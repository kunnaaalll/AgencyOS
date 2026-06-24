import structlog
from crawl4ai import AsyncWebCrawler
from duckduckgo_search import DDGS

from domain.discovery.sources.base import BaseDiscoverySource

logger = structlog.get_logger()

class Crawl4AISource(BaseDiscoverySource):
    source_name = "crawl4ai_web"

    async def _discover(self, industry: str, location: str, limit: int) -> list[dict]:
        results = []
        search_query = f"{industry} businesses in {location}"

        logger.info("Crawl4AI starting search", query=search_query, limit=limit)

        # 1. Find targets
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

        logger.info("Found URLs to scrape", count=len(urls_to_scrape))

        # 2. Extract with Crawl4AI
        async with AsyncWebCrawler(verbose=True) as crawler:
            for item in urls_to_scrape:
                try:
                    crawl_result = await crawler.arun(url=item["url"])

                    markdown_content = crawl_result.markdown

                    results.append(self._make_business_dict(
                        business_name=item["title"],
                        industry=industry,
                        location=location,
                        city=location.split(',')[0] if ',' in location else location,
                        website=item["url"],
                        raw_payload={
                            "source_type": "crawl4ai_web",
                            "search_snippet": item["search_snippet"],
                            "markdown": markdown_content[:5000] # Cap size to avoid huge payloads
                        }
                    ))
                    logger.info("Successfully crawled", url=item["url"])
                except Exception as e:
                    logger.warning("Failed to crawl with Crawl4AI", url=item["url"], error=str(e))
                    results.append(self._make_business_dict(
                        business_name=item["title"],
                        industry=industry,
                        location=location,
                        city=location.split(',')[0] if ',' in location else location,
                        website=item["url"],
                        raw_payload={
                            "source_type": "crawl4ai_failed",
                            "search_snippet": item["search_snippet"],
                            "error": str(e)
                        }
                    ))

        return results
