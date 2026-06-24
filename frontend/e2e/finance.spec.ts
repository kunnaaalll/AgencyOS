import { test, expect } from '@playwright/test';

// Before each test, login as admin
test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@agencyos.io');
  await page.fill('input[type="password"]', process.env.SEED_SUPERADMIN_PASSWORD || 'change_me_superadmin_password');
  await page.click('button:has-text("Sign in")');
  await expect(page).toHaveURL(/.*\/dashboard/);
});

test.describe('Finance Flow', () => {
  test('view finance dashboard', async ({ page }) => {
    // Navigate to Finance
    await page.click('nav a:has-text("Finance")');
    await expect(page).toHaveURL(/.*\/finance/);
    
    // Check if revenue/expenses cards are visible
    await expect(page.locator('h1')).toContainText('Finance OS');
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('text=Total Expenses')).toBeVisible();

    // Verify charts and data elements load
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible({ timeout: 10000 });
  });
});
