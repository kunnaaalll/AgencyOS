import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('successful login', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in the login form
    await page.fill('input[type="email"]', 'admin@agencyos.io');
    await page.fill('input[type="password"]', process.env.SEED_SUPERADMIN_PASSWORD || 'change_me_superadmin_password');
    
    // Click the sign in button
    await page.click('button:has-text("Sign in")');
    
    // Expect to be redirected to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test_successful_login.png' });
    await expect(page.getByRole('heading', { name: 'Executive Dashboard' })).toBeVisible();
  });

  test('failed login shows error', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Wait for the inputs to be visible
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await emailInput.waitFor({ state: 'visible' });
    
    const randomEmail = `wrong${Date.now()}@email.com`;
    await emailInput.fill(randomEmail);
    await passwordInput.fill('wrongpass');
    
    // Wait for button and click
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.waitFor({ state: 'visible' });
    await submitBtn.click();
    
    // Wait for error
    try {
      await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 10000 });
    } catch (e) {
      await page.screenshot({ path: 'test_failed_login.png' });
      throw e;
    }
  });
});
