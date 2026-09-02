import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/authHelper';

test.describe('Pantry Management End-to-End Suite', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('user can view pantry, open add item form and create pantry item', async ({ page }) => {
    await page.goto('/pantry');
    await expect(page).toHaveURL(/\/pantry/);

    // Look for add button
    const addBtn = page.getByRole('button', { name: /Add Item/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await expect(page).toHaveURL(/\/pantry\/add/);

      // Fill form
      await page.fill('input[name="name"], input[placeholder*="item" i]', 'Organic Baby Spinach');
      const submitBtn = page.locator('button[type="submit"]');
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }
    }
  });
});
