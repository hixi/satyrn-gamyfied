import { test, expect } from '@playwright/test';

test('Thread mode guides from one Bead to the next', async ({ page }) => {
  await page.goto('/#/thread');
  await page.getByRole('link', { name: /Lantern Room/i }).click();
  await expect(page.locator('satyrn-world')).toContainText(/Continue the Thread/i);
  await page.locator('satyrn-world [data-next-bead]').click();
  await expect(page.locator('satyrn-world')).toContainText(/Rain-Gauge/i);
});

test('Wander mode shows the Beads by act without a next CTA', async ({ page }) => {
  await page.goto('/#/');
  await page.getByRole('button', { name: 'Wander' }).click();
  await expect(page.locator('satyrn-map')).toContainText(/Act I/);
  await expect(page.locator('satyrn-map')).not.toContainText(/Continue the Thread/);
  // Nothing is locked: a late Bead is reachable directly from the map.
  await expect(page.locator('satyrn-map a[href="#/world/world.commons-garden"]')).toBeVisible();
});

test('choosing Wander on the thread route sticks and leaves the thread URL', async ({ page }) => {
  await page.goto('/#/thread');
  await expect(page.locator('satyrn-map')).toContainText(/Continue the Thread/);
  await page.getByRole('button', { name: 'Wander' }).click();
  await expect(page.locator('satyrn-map')).toContainText(/Act I/);
  await expect(page.locator('satyrn-map')).not.toContainText(/Continue the Thread/);
  await expect(page).toHaveURL(/#\/$/);
});