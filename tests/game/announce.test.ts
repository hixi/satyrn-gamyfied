import { describe, expect, test } from 'vitest';
import { announce } from '../../src/game/announce';

describe('announcer', () => {
  test('writes to the live region when present', () => {
    document.body.innerHTML = '<div id="satyrn-live" aria-live="polite"></div>';
    announce('hello');
    expect(document.getElementById('satyrn-live')?.textContent).toBe('hello');
  });

  test('no-ops without the live region', () => {
    document.body.innerHTML = '';
    expect(() => announce('hello')).not.toThrow();
  });
});
