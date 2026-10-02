import { describe, it, expect } from 'vitest';
import { getContent } from '../../src/content';
import { registerMechanics, registeredMechanicElement } from '../../src/mechanics/registry';

registerMechanics();

describe('the whole Thread', () => {
  it('names ten worlds — prologue plus nine Beads — each with a registered mechanic', () => {
    const content = getContent();
    const thread = content.threads['thread.main'];
    expect(thread.sequence.length).toBe(10);
    for (const worldId of thread.sequence) {
      const world = content.worlds[worldId];
      expect(world, worldId).toBeTruthy();
      expect(registeredMechanicElement(world.mechanic), world.mechanic).toBeTruthy();
    }
  });

  it('gives every world at least one concept, and every world a distinct mechanic', () => {
    const content = getContent();
    const tags = Object.values(content.worlds).map((w) => registeredMechanicElement(w.mechanic));
    expect(new Set(tags).size).toBe(tags.length);
    for (const world of Object.values(content.worlds)) {
      expect(world.concepts.length, world.id).toBeGreaterThan(0);
    }
  });
});