# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: discovery.spec.ts >> Discovery Flow >> view discovery runs and start new run
- Location: e2e/discovery.spec.ts:13:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="text"]').first()

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e5]:
    - link "AgencyOS" [ref=e7] [cursor=pointer]:
      - /url: /
      - img "AgencyOS" [ref=e8]
    - generic [ref=e10]:
      - link "Dashboard" [ref=e11] [cursor=pointer]:
        - /url: /dashboard
      - link "Leads" [ref=e12] [cursor=pointer]:
        - /url: /leads
      - link "Discovery" [active] [ref=e13] [cursor=pointer]:
        - /url: /discovery/runs
      - link "CRM" [ref=e14] [cursor=pointer]:
        - /url: /crm
      - link "Outreach" [ref=e15] [cursor=pointer]:
        - /url: /outreach
      - link "Clients" [ref=e16] [cursor=pointer]:
        - /url: /clients
      - link "Finance" [ref=e17] [cursor=pointer]:
        - /url: /finance
      - link "Knowledge" [ref=e18] [cursor=pointer]:
        - /url: /knowledge
      - link "Documents" [ref=e19] [cursor=pointer]:
        - /url: /documents
      - link "System" [ref=e20] [cursor=pointer]:
        - /url: /system/monitor
    - generic [ref=e21]:
      - button [ref=e22]:
        - img [ref=e23]
      - button [ref=e26]:
        - img [ref=e27]
      - button "Sign Out" [ref=e31]:
        - generic [ref=e32]: Sign Out
        - img
  - main [ref=e33]:
    - generic [ref=e34]:
      - generic [ref=e36]:
        - heading "Discovery Runs" [level=1] [ref=e37]
        - paragraph [ref=e38]: Manage and track your lead generation runs.
      - generic [ref=e39]:
        - heading "Start Bulk Run" [level=2] [ref=e40]
        - generic [ref=e41]:
          - generic [ref=e42]:
            - generic [ref=e43]: Sources
            - generic [ref=e44] [cursor=pointer]:
              - generic [ref=e45]: All Selected
              - img [ref=e46]
          - generic [ref=e48]:
            - generic [ref=e49]: Industries
            - generic [ref=e50] [cursor=pointer]:
              - generic [ref=e51]: All Selected
              - img [ref=e52]
          - generic [ref=e54]:
            - generic [ref=e55]: Locations
            - generic [ref=e56] [cursor=pointer]:
              - generic [ref=e57]: All Selected
              - img [ref=e58]
          - generic [ref=e60]:
            - generic [ref=e61]: Limit
            - spinbutton [ref=e62]: "10"
          - button "Start Bulk Run" [ref=e63]
      - table [ref=e66]:
        - rowgroup [ref=e67]:
          - row "Source Query Status Discovered Validated Date Action" [ref=e68]:
            - columnheader "Source" [ref=e69]
            - columnheader "Query" [ref=e70]
            - columnheader "Status" [ref=e71]
            - columnheader "Discovered" [ref=e72]
            - columnheader "Validated" [ref=e73]
            - columnheader "Date" [ref=e74]
            - columnheader "Action" [ref=e75]
        - rowgroup [ref=e76]:
          - row "google maps Tech Agencies in San Francisco PENDING 0 0 6/21/2026 View" [ref=e77]:
            - cell "google maps" [ref=e78]
            - cell "Tech Agencies in San Francisco" [ref=e79]
            - cell "PENDING" [ref=e80]
            - cell "0" [ref=e81]
            - cell "0" [ref=e82]
            - cell "6/21/2026" [ref=e83]
            - cell "View" [ref=e84]:
              - link "View" [ref=e85] [cursor=pointer]:
                - /url: /discovery/runs/8f8cf7fb-db74-4cc7-99ea-ab04d8bb1586
          - row "google maps Tech Agencies in San Francisco PENDING 0 0 6/21/2026 View" [ref=e86]:
            - cell "google maps" [ref=e87]
            - cell "Tech Agencies in San Francisco" [ref=e88]
            - cell "PENDING" [ref=e89]
            - cell "0" [ref=e90]
            - cell "0" [ref=e91]
            - cell "6/21/2026" [ref=e92]
            - cell "View" [ref=e93]:
              - link "View" [ref=e94] [cursor=pointer]:
                - /url: /discovery/runs/222242e7-6c4c-4bd5-9b55-23af04aea32e
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | // Before each test, login as admin
  4  | test.beforeEach(async ({ page }) => {
  5  |   await page.goto('/login');
  6  |   await page.fill('input[type="email"]', 'admin@agencyos.io');
  7  |   await page.fill('input[type="password"]', process.env.SEED_SUPERADMIN_PASSWORD || 'change_me_superadmin_password');
  8  |   await page.click('button:has-text("Sign in")');
  9  |   await expect(page).toHaveURL(/.*\/dashboard/);
  10 | });
  11 | 
  12 | test.describe('Discovery Flow', () => {
  13 |   test('view discovery runs and start new run', async ({ page }) => {
  14 |     // Navigate to Discovery Runs
  15 |     await page.click('nav a:has-text("Discovery")');
  16 |     await expect(page).toHaveURL(/.*\/discovery\/runs/);
  17 |     
  18 |     await expect(page.locator('h1')).toContainText('Discovery Runs');
  19 |     // Ensure the table or list of runs loads
  20 |     await expect(page.locator('text=Status')).toBeVisible();
  21 | 
  22 |     // Start a new run
> 23 |     await page.fill('input[type="text"] >> nth=0', 'Tech Agencies');
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  24 |     await page.fill('input[type="text"] >> nth=1', 'San Francisco');
  25 |     await page.click('button:has-text("Start Run")');
  26 | 
  27 |     // Should see the new run in the table shortly
  28 |     // Status might be INITIALIZING or similar
  29 |     await expect(page.locator('table')).toContainText('Tech Agencies in San Francisco', { timeout: 10000 });
  30 |   });
  31 | });
  32 | 
```