import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/authHelper';

test.describe('AI Recommendations & AI Chat End-to-End Suite', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('user can browse AI recommendations', async ({ page }) => {
    await page.goto('/ai-recommendations');
    await expect(page).toHaveURL(/\/ai-recommendations/);
  });

  test('user can open AI chat assistant and send culinary prompts', async ({ page }) => {
    await page.goto('/ai-chat');
    await expect(page).toHaveURL(/\/ai-chat/);

    const quickPrompt = page.getByRole('button', { name: /What can I cook tonight\?/i });
    if (await quickPrompt.isVisible()) {
      await quickPrompt.click();
    }
  });
});
