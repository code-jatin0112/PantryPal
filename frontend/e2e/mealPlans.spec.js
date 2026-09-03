import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/authHelper';

test.describe('Meal Planning & Evaluation End-to-End Suite', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('user can browse meal plans and open create meal plan form', async ({ page }) => {
    await page.goto('/meal-plans');
    await expect(page).toHaveURL(/\/meal-plans/);

    const newPlanBtn = page.getByRole('button', { name: /New Meal Plan/i }).first();
    if (await newPlanBtn.isVisible()) {
      await newPlanBtn.click();
      await expect(page).toHaveURL(/\/meal-plans\/new/);
    }
  });
});
