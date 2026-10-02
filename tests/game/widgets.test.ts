import { describe, expect, test } from 'vitest';
import { buttonSize } from '../../src/game/ui/sizes';

describe('widget factory', () => {
  test('buttons meet the touch target in both layout modes', () => {
    expect(buttonSize('compact').minHeight).toBeGreaterThanOrEqual(48);
    expect(buttonSize('expansive').minHeight).toBeGreaterThanOrEqual(48);
  });

  test('compact type runs larger than expansive type', () => {
    expect(buttonSize('compact').fontSize).toBeGreaterThan(buttonSize('expansive').fontSize);
  });
});
