import { describe, expect, test } from 'vitest';
import { createFocusRegistry } from '../../src/game/ui/focus';
import { computePlayRect, getLayoutMode } from '../../src/game/layout';

describe('focus registry', () => {
  test('moves forward skipping disabled ids and wraps', () => {
    const focus = createFocusRegistry();
    focus.register('a');
    focus.register('b');
    focus.register('c');
    focus.setEnabled('b', false);
    expect(focus.current()).toBe('a');
    expect(focus.move(1)).toBe('c');
    expect(focus.move(1)).toBe('a');
  });

  test('moves backward and wraps', () => {
    const focus = createFocusRegistry();
    focus.register('a');
    focus.register('b');
    expect(focus.move(-1)).toBe('b');
    expect(focus.move(-1)).toBe('a');
  });

  test('unregister removes the id', () => {
    const focus = createFocusRegistry();
    focus.register('a');
    focus.register('b');
    focus.unregister('a');
    expect(focus.current()).toBe('b');
    expect(focus.move(1)).toBe('b');
  });
});
