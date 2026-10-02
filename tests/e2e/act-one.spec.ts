import { test, expect } from '@playwright/test';

const FALLBACK = '[data-fallback]';
const TAG: Record<string, string> = {
  'rain-gauge-terrace': 'rain-gauge',
  'aviary-of-whispers': 'aviary',
  'cartwrights-yard': 'cartwright',
};

test('walks all three Act I Beads', async ({ page }) => {
  for (const slug of Object.keys(TAG)) {
    await page.goto(`/#/world/world.${slug}`);
    await expect(page.locator('satyrn-world')).toBeVisible();
    await page.locator(`satyrn-world mechanic-${TAG[slug]} ${FALLBACK}`).click();
  }
  await page.goto('/#/journal');
  await expect(page.locator('satyrn-moon')).toContainText(/Steady Hand/i);
  await expect(page.locator('satyrn-moon')).toContainText(/Right Bird/i);
  await expect(page.locator('satyrn-moon')).toContainText(/Rigged Right/i);
});