import { test, expect } from '@playwright/test';

test('boots to the title and exposes the gated e2e hook', async ({ page }) => {
  await page.goto('/?e2e=1#/');
  await expect(page.locator('#satyrn-live')).toContainText(/Wayfarer|Thread/);
  expect(await page.evaluate(() => (window as unknown as { __satyrn?: { version: number } }).__satyrn?.version)).toBe(2);
});

test('the e2e hook does not exist without the flag', async ({ page }) => {
  await page.goto('#/');
  expect(await page.evaluate(() => (window as unknown as { __satyrn?: unknown }).__satyrn)).toBeUndefined();
});
