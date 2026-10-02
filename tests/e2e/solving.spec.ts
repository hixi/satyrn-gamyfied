import { test, expect } from '@playwright/test';

// Solving in the browser grants the lesson and not the skip, proving the
// mechanic -> store -> achievement path end to end, in both directions.
test('solving a Bead grants the lesson, not the skip', async ({ page }) => {
  await page.goto('/#/world/world.aviary-of-whispers');
  await page.locator('satyrn-world mechanic-aviary button', { hasText: 'Show me a fitting' }).click();

  await page.goto('/#/world/world.gate-of-orders');
  await page.locator('satyrn-world mechanic-gate label', { hasText: 'Admit anyone carrying a lantern' }).click();

  await page.goto('/#/journal');
  const moon = page.locator('satyrn-moon');
  await expect(moon).toContainText(/Right Bird for the Errand/i);
  await expect(moon).toContainText(/A Standing Order That Stands/i);
  await expect(moon).not.toContainText(/The Wanderer/i);
});