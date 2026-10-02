import { describe, expect, test } from 'vitest';
import { applyEvent, createInitialState } from '../../src/store/state';
import { migrate } from '../../src/store/migrations';

describe('state v2', () => {
  test('initial state carries the v2 fields with sound off', () => {
    const state = createInitialState();
    expect(state.version).toBe(2);
    expect(state.stars).toEqual({});
    expect(state.earnedConcepts).toEqual([]);
    expect(state.seenPrologue).toBe(false);
    expect(state.seenActCards).toEqual([]);
    expect(state.settings.soundOn).toBe(false);
  });

  test('stars.awarded keeps the best per world', () => {
    let state = createInitialState();
    state = applyEvent(state, { type: 'stars.awarded', world: 'world.aviary-of-whispers', stars: 2 });
    state = applyEvent(state, { type: 'stars.awarded', world: 'world.aviary-of-whispers', stars: 1 });
    expect(state.stars['world.aviary-of-whispers']).toBe(2);
  });

  test('concept.earned, prologue.seen and actCard.seen record once', () => {
    let state = createInitialState();
    state = applyEvent(state, { type: 'concept.earned', concept: 'concept.attention' });
    state = applyEvent(state, { type: 'concept.earned', concept: 'concept.attention' });
    state = applyEvent(state, { type: 'prologue.seen' });
    state = applyEvent(state, { type: 'actCard.seen', act: 'act1' });
    state = applyEvent(state, { type: 'actCard.seen', act: 'act1' });
    expect(state.earnedConcepts).toEqual(['concept.attention']);
    expect(state.seenPrologue).toBe(true);
    expect(state.seenActCards).toEqual(['act1']);
  });

  test('migrate maps a v1 save to v2', () => {
    const v1 = {
      version: 1,
      mode: 'thread',
      visitedWorlds: ['world.lantern-room'],
      skippedWorlds: [],
      completedMechanics: [],
      completedEngineRooms: [],
      progress: {},
      evidence: {},
      achievements: [],
      settings: { reducedMotion: false },
    };
    const state = migrate(v1);
    expect(state.version).toBe(2);
    expect(state.seenPrologue).toBe(true);
    expect(state.settings.soundOn).toBe(false);
    expect(state.stars).toEqual({});
    expect(state.earnedConcepts).toEqual([]);
    expect(state.seenActCards).toEqual([]);
  });

  test('migrate of garbage yields the initial state', () => {
    expect(migrate('garbage')).toEqual(createInitialState());
  });
});
