import { test, expect } from '@playwright/test';

test('HUD toggles the mode from inside a world and shows the star count', async ({ page }) => {
  await page.goto('/?e2e=1#/world/world.aviary-of-whispers');
  const canvas = page.locator('#game canvas');
  await expect(canvas).toBeVisible();
  // The world scene owns Tab while a world is open; the HUD toggle is
  // reached by pointer. Wander sits second from the left; on compact
  // phones the buttons shrink but keep their left-edge positions.
  await page.waitForTimeout(1000);
  const hudBox = await canvas.boundingBox();
  const narrow = (hudBox?.width ?? 1280) < 700;
  await canvas.click({ position: { x: narrow ? 244 : 270, y: 32 } });
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.locator('#satyrn-live')).toContainText(/Wander/);
  await expect(page.locator('#satyrn-live')).toContainText(/0 of 27 stars/);
});

test('prologue walks three screens then lands on the map', async ({ page }) => {
  await page.goto('/?e2e=1#/');
  await page.waitForTimeout(1000);
  await expect(page.locator('#satyrn-live')).toContainText(/Wayfarer/);
  // Next is the first Tab stop on screens 1-2: Enter walks forward twice.
  // Each advance re-renders Title; wait for the new screen's live text
  // before Tabbing again, or the Tab can land on the outgoing buttons.
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await expect(page.locator('#satyrn-live')).toContainText(/companions/);
  await page.waitForTimeout(500);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await expect(page.locator('#satyrn-live')).toContainText(/how to play/i);
  await page.waitForTimeout(500);
  // Screen 3 has only Step onto the Thread: Tab to it, Enter lands on map.
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
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

test('journal opens from the map and Back returns', async ({ page }) => {
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
  // HUD Journal button: right side on desktop, second row on compact.
  const canvas = page.locator('#game canvas');
  const box = await canvas.boundingBox();
  const narrow = (box?.width ?? 1280) < 700;
  const journalPos = narrow ? { x: 82, y: 88 } : { x: (box?.width ?? 1280) - 170, y: 32 };
  await canvas.click({ position: journalPos });
  await expect(page).toHaveURL(/#\/journal/);
  await expect(page.locator('#satyrn-live')).toContainText(/Journey|Cards|Honors|Keepsake/);
  // Journal starts before its first stop: five Tabs reach Back.
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
  }
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/#\/$/);
});

test('world skip acknowledges honestly with a toast', async ({ page }) => {
  await page.goto('/?e2e=1#/world/world.aviary-of-whispers');
  await expect(page.locator('#game canvas')).toBeVisible();
  await page.waitForTimeout(1000);
  // Skip is the first Tab stop: Enter takes the honest out.
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await expect(page.locator('#satyrn-live')).toContainText(/come back later|honest/);
});

test('unknown routes land on a not-found card with a way home', async ({ page }) => {
  await page.goto('/?e2e=1#/nope');
  await expect(page.locator('#game canvas')).toBeVisible();
  await page.waitForTimeout(1000);
  await expect(page.locator('#satyrn-live')).toContainText(/not on the Thread/i);
  // Table stakes: Tab reaches Back, Enter takes it.
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/#\/$/);
});

async function skipPrologue(page: import('@playwright/test').Page): Promise<void> {
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
}

test('sound stays off by default, toggles on, and persists across reload', async ({ page }) => {
  await page.goto('/?e2e=1#/');
  await page.waitForTimeout(1000);
  await skipPrologue(page);
  // Sound button: right edge of the HUD (desktop) or second row (compact).
  const canvas = page.locator('#game canvas');
  const box = await canvas.boundingBox();
  const narrow = (box?.width ?? 1280) < 700;
  const soundPos = narrow ? { x: 204, y: 88 } : { x: (box?.width ?? 1280) - 60, y: 32 };
  await canvas.click({ position: soundPos });
  await expect(page.locator('#satyrn-live')).toContainText(/Sound on/);
  const persisted = await page.evaluate(() => window.localStorage.getItem('satyrn-book-as-game:v1'));
  expect(persisted).toContain('"soundOn":true');
  await page.reload();
  await page.waitForTimeout(1000);
  const after = await page.evaluate(() => window.localStorage.getItem('satyrn-book-as-game:v1'));
  expect(after).toContain('"soundOn":true');
});

test('Esc backs out of a world to the map', async ({ page }) => {
  await page.goto('/?e2e=1#/world/world.aviary-of-whispers');
  await expect(page.locator('#game canvas')).toBeVisible();
  await page.waitForTimeout(1000);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/#\/$/);
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

test('portrait phone: compact map fits without scrolling, targets fit fingers', async ({ page }) => {
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
  // The canvas fills the viewport width: no horizontal page scrolling.
  const viewportWidth = page.viewportSize()?.width ?? 390;
  const canvasWidth = await page.evaluate(() => document.querySelector('#game canvas')?.clientWidth ?? 0);
  expect(canvasWidth).toBeLessThanOrEqual(viewportWidth + 1);
  expect(await page.evaluate(() => document.body.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  // Title Skip is reachable by tap on touch devices and click elsewhere:
  // go back and activate it with the available input.
  await page.goto('/?e2e=1#/');
  await page.waitForTimeout(1000);
  const canvas = page.locator('#game canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  const skipPos = { x: (box?.width ?? 390) / 2 + 110, y: (box?.height ?? 844) - 120 };
  const hasTouch = await page.evaluate(() => 'ontouchstart' in window || navigator.maxTouchPoints > 0);
  if (hasTouch) {
    await canvas.tap({ position: skipPos });
  } else {
    await canvas.click({ position: skipPos });
  }
  await page.waitForTimeout(500);
  await expect(page.locator('#satyrn-live')).toContainText(/Lantern Room/);
});
