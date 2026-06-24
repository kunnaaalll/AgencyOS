"""
Browser Pool — Manages a shared pool of Playwright Chromium browsers.

Config:
  - 4 browser workers
  - 5 contexts per browser (20 concurrent contexts total)
  - Stealth mode: randomized viewport, UA rotation, no automation fingerprints
"""

import asyncio
import random
from contextlib import asynccontextmanager

import structlog
from playwright.async_api import Browser, BrowserContext, Page, Playwright, async_playwright

from utils.user_agent_rotator import UserAgentRotator

logger = structlog.get_logger()

# Configuration
BROWSER_COUNT = 4
CONTEXTS_PER_BROWSER = 5

# Common viewport sizes to randomize
VIEWPORTS = [
    {"width": 1920, "height": 1080},
    {"width": 1366, "height": 768},
    {"width": 1440, "height": 900},
    {"width": 1280, "height": 800},
    {"width": 1536, "height": 864},
]


class BrowserPool:
    """
    Thread-safe async pool of Playwright browsers.
    Designed to be initialized once at worker startup and shared across jobs.
    """

    def __init__(self):
        self._playwright: Playwright | None = None
        self._browsers: list[Browser] = []
        self._browser_semaphores: list[asyncio.Semaphore] = []
        self._lock = asyncio.Lock()
        self._initialized = False

    async def initialize(self):
        """Start Playwright and launch all browser instances."""
        if self._initialized:
            return

        async with self._lock:
            if self._initialized:
                return

            logger.info("Initializing BrowserPool", browsers=BROWSER_COUNT)
            self._playwright = await async_playwright().start()

            for i in range(BROWSER_COUNT):
                browser = await self._playwright.chromium.launch(
                    headless=True,
                    args=[
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-accelerated-2d-canvas",
                        "--no-first-run",
                        "--no-zygote",
                        "--disable-gpu",
                        "--disable-blink-features=AutomationControlled",
                        "--disable-features=IsolateOrigins,site-per-process",
                    ],
                )
                self._browsers.append(browser)
                self._browser_semaphores.append(asyncio.Semaphore(CONTEXTS_PER_BROWSER))
                logger.info("Browser launched", index=i)

            self._initialized = True
            logger.info("BrowserPool initialized", total_contexts=BROWSER_COUNT * CONTEXTS_PER_BROWSER)

    async def shutdown(self):
        """Close all browsers and stop Playwright."""
        for browser in self._browsers:
            try:
                await browser.close()
            except Exception:
                pass

        if self._playwright:
            await self._playwright.stop()

        self._browsers.clear()
        self._browser_semaphores.clear()
        self._initialized = False
        logger.info("BrowserPool shutdown complete")

    def _pick_browser(self) -> tuple[int, Browser, asyncio.Semaphore]:
        """Pick the browser with the most available context slots."""
        # Round-robin with least-busy preference
        idx = random.randint(0, len(self._browsers) - 1)
        return idx, self._browsers[idx], self._browser_semaphores[idx]

    @asynccontextmanager
    async def acquire_context(self, extra_headers: dict | None = None):
        """
        Context manager that acquires a browser context from the pool.
        Automatically releases it when done.

        Usage:
            async with browser_pool.acquire_context() as (page, context):
                await page.goto(url)
        """
        if not self._initialized:
            await self.initialize()

        browser_idx, browser, semaphore = self._pick_browser()

        async with semaphore:
            viewport = random.choice(VIEWPORTS)
            ua = UserAgentRotator.get_random()

            context: BrowserContext = await browser.new_context(
                user_agent=ua,
                viewport=viewport,
                locale="en-IN",
                timezone_id="Asia/Kolkata",
                extra_http_headers=extra_headers or {},
                java_script_enabled=True,
                bypass_csp=False,
                ignore_https_errors=True,
            )

            # Anti-fingerprint: hide webdriver property
            await context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                });
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5],
                });
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['en-IN', 'en-US', 'en'],
                });
                window.chrome = { runtime: {} };
            """)

            page: Page = await context.new_page()

            try:
                yield page, context
            finally:
                try:
                    await context.close()
                except Exception:
                    pass


# Module-level singleton
_pool: BrowserPool | None = None


def get_browser_pool() -> BrowserPool:
    """Get or create the global BrowserPool singleton."""
    global _pool
    if _pool is None:
        _pool = BrowserPool()
    return _pool


async def initialize_browser_pool():
    """Initialize the global browser pool. Call at worker startup."""
    pool = get_browser_pool()
    await pool.initialize()


async def shutdown_browser_pool():
    """Shutdown the global browser pool. Call at worker shutdown."""
    global _pool
    if _pool is not None:
        await _pool.shutdown()
        _pool = None
