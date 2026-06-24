import { test, expect } from '@playwright/test';

// Before each test, login as admin
test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@agencyos.io');
  await page.fill('input[type="password"]', process.env.SEED_SUPERADMIN_PASSWORD || 'change_me_superadmin_password');
  await page.click('button:has-text("Sign in")');
  await expect(page).toHaveURL(/.*\/dashboard/);
});

test.describe('CRM Flow', () => {
  test('view crm board', async ({ page }) => {
    // Navigate to CRM
    await page.click('nav a:has-text("CRM")');
    await expect(page).toHaveURL(/.*\/crm/);
    
    // Check if board renders
    await expect(page.locator('h1')).toContainText('Pipeline Board');
    
    // Ensure standard columns are visible (NEW, QUALIFIED, CONTACTED, MEETING, PROPOSAL, WON, LOST)
    await expect(page.getByRole('heading', { name: 'NEW', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'QUALIFIED', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'PROPOSAL', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'WON', exact: true })).toBeVisible();
    
    // Verify that opportunity cards are present (based on demo data)
    await expect(page.locator('.bg-\\[var\\(--color-surface-card\\)\\]').first()).toBeVisible({ timeout: 10000 });
  });
});
