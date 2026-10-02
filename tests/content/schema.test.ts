import { describe, it, expect } from 'vitest';
import { ConceptSchema, WorldSchema, AchievementSchema } from '../../tools/content/schema';

describe('content schemas', () => {
  it('accepts a valid concept', () => {
    expect(ConceptSchema.parse({ id: 'concept.tokens', term: 'Token', short: 'A unit of text.', body: 'Body.' }))
      .toMatchObject({ related: [] });
  });
  it('rejects an un-namespaced id', () => {
    expect(() => ConceptSchema.parse({ id: 'tokens', term: 'T', short: 's', body: 'b' })).toThrow();
  });
  it('accepts a world with an engine room', () => {
    const w = WorldSchema.parse({ id: 'world.rain-gauge', title: 'Rain-Gauge Terrace', act: 'act1', order: 1, mechanic: 'mechanic.pour', summary: 's', intro: 'i', engineRoom: { title: 'Deep', body: 'b' } });
    expect(w.concepts).toEqual([]);
  });
  it('accepts a recursive achievement condition', () => {
    const a = AchievementSchema.parse({ id: 'achievement.first-light', title: 'First Light', description: 'd', kind: 'lesson', condition: { all: [{ event: 'mechanic.completed', mechanic: 'mechanic.lantern' }] } });
    expect(a.kind).toBe('lesson');
  });
});