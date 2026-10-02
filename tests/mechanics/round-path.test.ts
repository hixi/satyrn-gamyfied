import { describe, it, expect } from 'vitest';
import { getContent } from '../../src/content';
import { registerMechanics } from '../../src/mechanics/registry';
import { mountMechanic } from './helper';

registerMechanics();
const authored = getContent().mechanics['mechanic.round-path'].params as any;

describe('round path', () => {
  it('is solvable by selecting the authored repeating block', async () => {
    const { el, events } = mountMechanic('mechanic-round-path', 'mechanic.round-path', 'world.round-path', authored);
    await el.updateComplete;
    for (let i = authored.cycleStart; i < authored.cycleStart + authored.cycleLength; i++) {
      el.select(authored.steps[i].id);
    }
    expect(el.breakLoop()).toBe('broken');
    await el.updateComplete;
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(true);
    expect(events.some((e) => e.type === 'evidence.submitted' && (e.evidence as any).usedFallback === false)).toBe(true);
  });

  it('rejects a block that is not the repeating one', async () => {
    const { el, events } = mountMechanic('mechanic-round-path', 'mechanic.round-path', 'world.round-path', authored);
    await el.updateComplete;
    el.select(authored.steps[0].id);
    expect(el.breakLoop()).toBe('wrong-loop');
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(false);
  });

  it('reports not-selected when nothing is chosen', async () => {
    const { el } = mountMechanic('mechanic-round-path', 'mechanic.round-path', 'world.round-path', authored);
    await el.updateComplete;
    expect(el.breakLoop()).toBe('not-selected');
  });

  it('falls back to a default scenario when params are malformed', async () => {
    const { el } = mountMechanic('mechanic-round-path', 'mechanic.round-path', 'world.round-path', { steps: 'nope' });
    await el.updateComplete;
    expect(el.steps.length).toBeGreaterThan(0);
    expect(el.cycleLength).toBeGreaterThan(0);
  });

  it('completes via the accessible continue control', async () => {
    const { el, events } = mountMechanic('mechanic-round-path', 'mechanic.round-path', 'world.round-path', authored);
    await el.updateComplete;
    el.renderRoot.querySelector('[data-fallback]').click();
    await el.updateComplete;
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(true);
  });
});