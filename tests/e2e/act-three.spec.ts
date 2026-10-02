import { test, expect } from '@playwright/test';

const FALLBACK = '[data-fallback]';
const TAG: Record<string, string> = {
  'blueprint-and-mason': 'blueprint',
  'well-and-pipe': 'well',
  'commons-garden': 'garden',
};

test('walks all three Act III Beads', async ({ page }) => {
  for (const slug of Object.keys(TAG)) {
    await page.goto(`/#/world/world.${slug}`);
    await expect(page.locator('satyrn-world')).toBeVisible();
    await page.locator(`satyrn-world mechanic-${TAG[slug]} ${FALLBACK}`).click();
  }
  await page.goto('/#/journal');
  await expect(page.locator('satyrn-moon')).toContainText(/Measurable/i);
  await expect(page.locator('satyrn-moon')).toContainText(/Your Own Well/i);
  await expect(page.locator('satyrn-moon')).toContainText(/Planted/i);
});