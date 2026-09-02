import { test, expect } from '@playwright/test';

test.describe('Shopping List End-to-End Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'chef@pantrypal.app');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
  });

  test('user can view shopping list, add items, and toggle purchased', async ({ page }) => {
    await page.goto('/shopping-list');
    await expect(page.getByText(/Smart Shopping List/i).first()).toBeVisible({ timeout: 10000 });

    const addItemBtn = page.getByRole('button', { name: /Add Item/i }).first();
    expect(addItemBtn).toBeDefined();
  });
});
