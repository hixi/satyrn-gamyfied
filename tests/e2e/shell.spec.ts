import { test, expect } from '@playwright/test';

test('HUD toggles the mode from inside a world and shows the star count', async ({ page }) => {
  await page.goto('/?e2e=1#/world/world.aviary-of-whispers');
  const canvas = page.locator('#game canvas');
  await expect(canvas).toBeVisible();
  // The world scene owns Tab while a world is open; the HUD toggle is
  // reached by pointer. Click Wander (second HUD button from the left).
  await page.waitForTimeout(1000);
  await canvas.click({ position: { x: 270, y: 32 } });
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.locator('#satyrn-live')).toContainText(/Wander/);
  await expect(page.locator('#satyrn-live')).toContainText(/0 of 27 stars/);
});

test('prologue walks three screens then lands on the map', async ({ page }) => {
  await page.goto('/?e2e=1#/');
  await page.waitForTimeout(1000);
  await expect(page.locator('#satyrn-live')).toContainText(/Wayfarer/);
  // Next is the first Tab stop on screens 1-2: Enter walks forward twice.
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await expect(page.locator('#satyrn-live')).toContainText(/companions/);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await expect(page.locator('#satyrn-live')).toContainText(/how to play/i);
  // Screen 3 has only Step onto the Thread: Enter lands on the map.
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.locator('#satyrn-live')).toContainText(/Lantern Room/);
});

test('map switches between thread and wander modes', async ({ page }) => {
  await page.goto('/?e2e=1#/');
  await page.waitForTimeout(1000);
  // Skip the prologue: Tab twice from Next, Enter on Skip.
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await expect(page.locator('#satyrn-live')).toContainText(/Lantern Room/);
  // Wander groups the beads by act; the live region names the act labels.
  await page.evaluate(() => {
    const store = (window as unknown as { game: { registry: { get(k: string): { dispatch(e: unknown): void } } } }).game.registry.get('store');
    store.dispatch({ type: 'mode.changed', mode: 'wander' });
  });
  await page.waitForTimeout(500);
  const wanderLive = await page.evaluate(() => (window as unknown as { __satyrn: { live(): string | null } }).__satyrn.live());
  expect(wanderLive).toMatch(/All the Beads/);
  // Thread returns to the stitched path.
  await page.evaluate(() => {
    const store = (window as unknown as { game: { registry: { get(k: string): { dispatch(e: unknown): void } } } }).game.registry.get('store');
    store.dispatch({ type: 'mode.changed', mode: 'thread' });
  });
  await expect(page.locator('#satyrn-live')).toContainText(/The Thread/);
});

test('map continues the thread to the next bead (placeholder)', async ({ page }) => {
  await page.goto('/?e2e=1#/');
  await page.waitForTimeout(1000);
  // Skip is the second stop: Tab twice from Next, Enter skips to the map.
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await expect(page.locator('#satyrn-live')).toContainText(/Lantern Room/);
  // Map owns Tab now: one Tab lands on Continue the Thread, Enter walks on.
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/#\/world\/world\.lantern-room/);
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
