import { describe, expect, test } from 'vitest';
import { computePlayRect, getLayoutMode } from '../../src/game/layout';

describe('layout', () => {
  test('picks compact for portrait phones and narrow screens', () => {
    expect(getLayoutMode(390, 844)).toBe('compact');
    expect(getLayoutMode(500, 400)).toBe('compact');
    expect(getLayoutMode(1280, 800)).toBe('expansive');
  });

  test('play rect subtracts the HUD bar and safe-area insets', () => {
    const rect = computePlayRect(390, 844, { top: 47, bottom: 34 });
    expect(rect.w).toBe(390);
    expect(rect.h).toBe(844 - 64 - 47 - 34);
    expect(rect.h).toBeGreaterThan(0);
  });
});

describe('scroll math', () => {
  test('clamps the scroll offset to the content bounds', async () => {
    const { clampScroll } = await import('../../src/game/layout');
    expect(clampScroll(-10, 800, 400)).toBe(0);
    expect(clampScroll(90, 800, 400)).toBe(90);
    expect(clampScroll(500, 800, 400)).toBe(400);
    expect(clampScroll(100, 800, 400)).toBe(100);
  });
});
