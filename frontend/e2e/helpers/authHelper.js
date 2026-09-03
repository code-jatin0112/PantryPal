export async function loginAsTestUser(page) {
  const timestamp = Date.now();
  const testUser = {
    name: 'Chef Automation',
    email: `auto_${timestamp}_${Math.random().toString(36).substring(7)}@pantrypal.app`,
    password: 'Password123!',
  };

  await page.goto('/register');
  await page.fill('input[type="text"], input[placeholder*="Name" i], input[placeholder*="Chef" i]', testUser.name);
  await page.fill('input[type="email"]', testUser.email);
  await page.fill('input[type="password"]', testUser.password);
  await page.click('button[type="submit"]');

  // Wait until navigated away from /register
  await page.waitForURL((url) => !url.pathname.includes('/register') && !url.pathname.includes('/login'), {
    timeout: 10000,
  });
}
