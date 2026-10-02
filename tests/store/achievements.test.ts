import { describe, it, expect } from 'vitest';
import { matchesCondition, evaluateAchievements } from '../../src/store/achievements';
import { createInitialState } from '../../src/store/state';

const A = (id: string, extra: Record<string, unknown> = {}): any => ({
  id,
  title: id,
  description: '',
  kind: 'lesson',
  ...extra,
});
const done = { type: 'mechanic.completed' as const, mechanic: 'mechanic.lantern', world: 'world.lantern-room' };

describe('achievements', () => {
  it('matches a leaf condition on the current event', () => {
    expect(matchesCondition(createInitialState(), done, { event: 'mechanic.completed', mechanic: 'mechanic.lantern' })).toBe(true);
  });
  it('does not match a different mechanic', () => {
    expect(matchesCondition(createInitialState(), done, { event: 'mechanic.completed', mechanic: 'mechanic.other' })).toBe(false);
  });
  it('matches a condition from accumulated state alone', () => {
    const s = { ...createInitialState(), visitedWorlds: ['world.lantern-room'] };
    const noop = { type: 'world.entered', world: 'world.other' } as const;
    expect(matchesCondition(s, noop, { event: 'world.entered', world: 'world.lantern-room' })).toBe(true);
  });
  it('supports all / any / not', () => {
    const s = createInitialState();
    expect(matchesCondition(s, done, { all: [{ event: 'mechanic.completed' }, { not: { event: 'world.skipped' } }] })).toBe(true);
    expect(matchesCondition(s, done, { any: [{ event: 'world.skipped' }, { event: 'mechanic.completed' }] })).toBe(true);
  });
  it('returns only newly earned achievements', () => {
    const s = { ...createInitialState(), achievements: ['achievement.first-light'] };
    const earned = evaluateAchievements(s, done, [
      A('achievement.first-light', { condition: { event: 'mechanic.completed' } }),
      A('achievement.new', { condition: { event: 'mechanic.completed' } }),
    ]);
    expect(earned).toEqual(['achievement.new']);
  });
  it('uses a registered predicate through the same seam', () => {
    const s = createInitialState();
    const predicates = { 'achievement.odd': (_s: unknown, e: any) => e.type === 'world.entered' };
    const earned = evaluateAchievements(s, { type: 'world.entered', world: 'world.x' }, [
      A('achievement.odd', { predicate: 'achievement.odd' }),
    ], predicates);
    expect(earned).toEqual(['achievement.odd']);
  });
});