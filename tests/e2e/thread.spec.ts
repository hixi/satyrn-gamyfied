import { test, expect } from '@playwright/test';

test('walks the Thread through the prologue', async ({ page }) => {
  await page.goto('/#/thread');
  await expect(page.locator('satyrn-map')).toBeVisible();

  await page.locator('satyrn-map a', { hasText: /Lantern Room/i }).click();
  await expect(page.locator('satyrn-world')).toBeVisible();

  // Continue without playing is an honest skip: it is recorded and
  // acknowledged, and it does not grant the lesson.
  await page.locator('satyrn-world mechanic-lantern [data-fallback]').click();

  await page.locator('satyrn-app a[href="#/journal"]').click();
  const moon = page.locator('satyrn-app main satyrn-moon');
  await expect(moon).toContainText(/The Wanderer/i);
  await expect(moon).not.toContainText(/First Light/i);
});