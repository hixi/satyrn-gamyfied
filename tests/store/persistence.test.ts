import { describe, it, expect } from 'vitest';
import { loadState, saveState, exportState, importState, type StoragePort } from '../../src/store/persistence';
import { createInitialState } from '../../src/store/state';

function fakeStorage(seed: Record<string, string> = {}): StoragePort {
  const m = new Map(Object.entries(seed));
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => {
      m.set(k, v);
    },
    removeItem: (k) => {
      m.delete(k);
    },
  };
}

describe('persistence', () => {
  it('round-trips state', () => {
    const s = { ...createInitialState(), visitedWorlds: ['world.lantern-room'] };
    const st = fakeStorage();
    saveState(st, s);
    expect(loadState(st).visitedWorlds).toEqual(['world.lantern-room']);
  });
  it('falls back to initial state on corrupt JSON', () => {
    expect(loadState(fakeStorage({ 'satyrn-book-as-game:v1': '{not json' })).visitedWorlds).toEqual([]);
  });
  it('falls back to initial state on a wrong-shaped value', () => {
    expect(loadState(fakeStorage({ 'satyrn-book-as-game:v1': '{"version":1,"mode":42}' })).mode).toBe('thread');
  });
  it('exports and imports a valid string', () => {
    const s = { ...createInitialState(), achievements: ['achievement.first-light'] };
    expect(importState(exportState(s)).achievements).toEqual(['achievement.first-light']);
  });
  it('rejects a corrupt import string', () => {
    expect(() => importState('nope')).toThrow(/import/i);
  });
});