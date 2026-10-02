import { describe, expect, test } from 'vitest';
import {
  getReturnTo,
  normalizeRoute,
  routeToSceneKey,
  setReturnTo,
} from '../../src/game/router-bridge';

describe('router bridge', () => {
  test('legacy thread route normalizes to the map', () => {
    expect(normalizeRoute({ name: 'thread' }, 'wander')).toEqual({ name: 'map' });
  });

  test('world routes map to the world scene', () => {
    expect(routeToSceneKey({ name: 'world', worldId: 'world.lantern-room' })).toBe('world');
  });

  test('returnTo defaults to the map and remembers the setter', () => {
    expect(getReturnTo()).toBe('#/');
    setReturnTo('#/world/world.aviary-of-whispers');
    expect(getReturnTo()).toBe('#/world/world.aviary-of-whispers');
    setReturnTo('#/');
  });
});
