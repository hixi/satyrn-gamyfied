import { test, expect } from '@playwright/test';

test('walks the Thread through the prologue', async ({ page }) => {
  await page.goto('/#/thread');
  await expect(page.locator('satyrn-map')).toBeVisible();

  await page.locator('satyrn-map a', { hasText: /Lantern Room/i }).click();
  await expect(page.locator('satyrn-world')).toBeVisible();

  await page.locator('satyrn-world mechanic-lantern [data-fallback]').click();

  await page.locator('satyrn-app a[href="#/journal"]').click();
  await expect(page.locator('satyrn-app main satyrn-moon')).toContainText(/First Light/i);
  // Continuing without playing is an honest skip, acknowledged distinctly.
  await expect(page.locator('satyrn-app main satyrn-moon')).toContainText(/The Wanderer/i);
});