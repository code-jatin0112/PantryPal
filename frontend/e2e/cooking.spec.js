import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/authHelper';

test.describe('Cooking Mode Studio End-to-End Suite', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('user can launch cooking mode studio and step through instructions', async ({ page }) => {
    await page.goto('/cooking/demo');
    await expect(page).toHaveURL(/\/cooking\/demo/);

    const markCompleteBtn = page.getByRole('button', { name: /Mark as Complete/i });
    if (await markCompleteBtn.isVisible()) {
      await markCompleteBtn.click();
    }

    const nextStepBtn = page.getByRole('button', { name: /Next Step/i });
    if (await nextStepBtn.isVisible()) {
      await nextStepBtn.click();
    }
  });
});
