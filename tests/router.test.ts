import { describe, it, expect } from 'vitest';
import { parseHash, routeToHash } from '../src/router';

describe('router', () => {
  it('parses the empty hash as the map', () => {
    expect(parseHash('')).toEqual({ name: 'map' });
    expect(parseHash('#/')).toEqual({ name: 'map' });
  });
  it('parses world and concept routes', () => {
    expect(parseHash('#/world/world.lantern-room')).toEqual({ name: 'world', worldId: 'world.lantern-room' });
    expect(parseHash('#/concept/concept.tokens')).toEqual({ name: 'concept', conceptId: 'concept.tokens' });
  });
  it('returns notFound for an unknown top-level path', () => {
    expect(parseHash('#/nonsense')).toEqual({ name: 'notFound', path: 'nonsense' });
  });
  it('round-trips every known route', () => {
    for (const r of [
      { name: 'map' } as const,
      { name: 'thread' } as const,
      { name: 'journal' } as const,
      { name: 'world', worldId: 'world.x' } as const,
      { name: 'concept', conceptId: 'concept.x' } as const,
    ]) {
      expect(parseHash(routeToHash(r))).toEqual(r);
    }
  });
});