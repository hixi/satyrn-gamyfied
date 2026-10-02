import { test, expect } from '@playwright/test';

test('HUD toggles the mode from inside a world and shows the star count', async ({ page }) => {
  await page.goto('/?e2e=1#/world/world.aviary-of-whispers');
  const canvas = page.locator('#game canvas');
  await expect(canvas).toBeVisible();
  // HUD Tab order: Thread, Wander, Journal, Sound. One Tab reaches Wander.
  // Wait for the HUD scene to finish wiring before pressing Tab: the canvas
  // is visible a frame before the overlay's keyboard handlers attach.
  await page.waitForFunction(() => {
    const g = (window as unknown as { game?: { scene: { getScene(k: string): unknown } } }).game;
    if (!g) return false;
    const hud = g.scene.getScene('hud') as unknown as Record<string, unknown> | null;
    if (!hud) return false;
    const widgets = hud.__satyrnWidgets as { taps?: Map<string, unknown> } | undefined;
    return (widgets?.taps?.size ?? 0) > 0;
  });
  await page.keyboard.press('Tab');
  // Let the HUD's Tab handler run before Enter: without a beat between them
  // the keydown queue can deliver Enter first and activate the wrong button.
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.locator('#satyrn-live')).toContainText(/Wander/);
  await expect(page.locator('#satyrn-live')).toContainText(/0 of 27 stars/);
});

test('boots to the title and exposes the gated e2e hook', async ({ page }) => {
  await page.goto('/?e2e=1#/');
  await expect(page.locator('#satyrn-live')).toContainText(/Wayfarer|Thread/);
  expect(await page.evaluate(() => (window as unknown as { __satyrn?: { version: number } }).__satyrn?.version)).toBe(2);
});

test('the e2e hook does not exist without the flag', async ({ page }) => {
  await page.goto('#/');
  expect(await page.evaluate(() => (window as unknown as { __satyrn?: unknown }).__satyrn)).toBeUndefined();
});
