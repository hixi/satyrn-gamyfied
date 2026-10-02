import { describe, it, expect } from 'vitest';
import { getContent } from '../../src/content';
import { registerMechanics, registeredMechanics, registeredMechanicElement } from '../../src/mechanics/registry';
import { validateContent } from '../../tools/content/validate';
import { loadRawContent } from '../../tools/content/load';

registerMechanics();

describe('Act III', () => {
  it('has three Beads in act3, in order, each with a distinct mechanic', () => {
    const worlds = Object.values(getContent().worlds).filter((w) => w.act === 'act3').sort((a, b) => a.order - b.order);
    expect(worlds.map((w) => w.order)).toEqual([7, 8, 9]);
    const tags = worlds.map((w) => registeredMechanicElement(w.mechanic));
    expect(tags.every(Boolean)).toBe(true);
    expect(new Set(tags).size).toBe(3);
  });

  it('every Act III mechanic is registered and content validates', () => {
    const content = validateContent(loadRawContent('content'));
    for (const world of Object.values(content.worlds).filter((w) => w.act === 'act3')) {
      expect(registeredMechanics()).toContain(world.mechanic);
    }
  });
});