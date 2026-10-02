import { test, expect } from '@playwright/test';

const FALLBACK = '[data-fallback]';
const TAG: Record<string, string> = {
  'round-path': 'round-path',
  'gate-of-orders': 'gate',
  'assayers-scale': 'assayers-scale',
};

test('walks all three Act II Beads', async ({ page }) => {
  for (const slug of Object.keys(TAG)) {
    await page.goto(`/#/world/world.${slug}`);
    await expect(page.locator('satyrn-world')).toBeVisible();
    await page.locator(`satyrn-world mechanic-${TAG[slug]} ${FALLBACK}`).click();
  }
  await page.goto('/#/journal');
  await expect(page.locator('satyrn-moon')).toContainText(/Broken Circle/i);
  await expect(page.locator('satyrn-moon')).toContainText(/Standing Order/i);
  await expect(page.locator('satyrn-moon')).toContainText(/A Check That Can Fail/i);
});