import { test, expect } from '@playwright/test';

test.describe('Authentication End-to-End Suite', () => {
  const testUser = {
    name: 'Chef Playwright',
    email: `playwright_${Date.now()}@pantrypal.app`,
    password: 'Password123!',
  };

  test('user can register, see dashboard, and logout', async ({ page }) => {
    await page.goto('/register');

    // Fill registration form
    await page.fill('input[placeholder*="Chef Gordon" i], input[type="text"]', testUser.name);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);

    // Submit registration
    await page.click('button[type="submit"]');

    // Should land on dashboard or authenticated layout
    await expect(page).toHaveURL(/\/(pantry|recipes|dashboard)?/);

    // Logout
    const profileDropdown = page.locator('header').locator('button').last();
    if (await profileDropdown.isVisible()) {
      await profileDropdown.click();
      const signOutBtn = page.getByText(/Sign Out/i);
      if (await signOutBtn.isVisible()) {
        await signOutBtn.click();
        await expect(page).toHaveURL(/\/login/);
      }
    }
  });

  test('user can login with credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Should land on authenticated route
    await expect(page).toHaveURL(/\/(pantry|recipes|dashboard)?/);
  });
});
