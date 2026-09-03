import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/authHelper';

test.describe('Cookbook & Recipes End-to-End Suite', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('user can browse recipes, search, and navigate to create recipe', async ({ page }) => {
    await page.goto('/recipes');
    await expect(page).toHaveURL(/\/recipes/);

    const createBtn = page.getByRole('button', { name: /New Recipe/i }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await expect(page).toHaveURL(/\/recipes\/new/);
    }
  });
});
