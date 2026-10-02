import { describe, it, expect } from 'vitest';
import { createInitialState, applyEvent } from '../../src/store/state';

describe('applyEvent', () => {
  it('records a visited world once', () => {
    let s = applyEvent(createInitialState(), { type: 'world.entered', world: 'world.lantern-room' });
    s = applyEvent(s, { type: 'world.entered', world: 'world.lantern-room' });
    expect(s.visitedWorlds).toEqual(['world.lantern-room']);
  });
  it('records progress and completion separately', () => {
    let s = applyEvent(createInitialState(), { type: 'mechanic.progress', mechanic: 'mechanic.lantern', value: 0.5 });
    s = applyEvent(s, { type: 'mechanic.completed', mechanic: 'mechanic.lantern', world: 'world.lantern-room' });
    expect(s.progress['mechanic.lantern']).toBe(0.5);
    expect(s.completedMechanics).toEqual(['mechanic.lantern']);
  });
  it('records a skip honestly', () => {
    const s = applyEvent(createInitialState(), { type: 'world.skipped', world: 'world.lantern-room' });
    expect(s.skippedWorlds).toEqual(['world.lantern-room']);
  });
  it('does not mutate the input state', () => {
    const before = createInitialState();
    applyEvent(before, { type: 'world.entered', world: 'world.lantern-room' });
    expect(before.visitedWorlds).toEqual([]);
  });
});