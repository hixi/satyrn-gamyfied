import { describe, it, expect } from 'vitest';
import { getContent } from '../../src/content';
import { registerMechanics } from '../../src/mechanics/registry';
import { mountMechanic } from './helper';

registerMechanics();
const authored = getContent().mechanics['mechanic.rain-gauge'].params as any;

describe('rain gauge', () => {
  it('is completable by keyboard from the authored scenario', async () => {
    const { el, events } = mountMechanic('mechanic-rain-gauge', 'mechanic.rain-gauge', 'world.rain-gauge-terrace', authored);
    await el.updateComplete;
    for (const drop of authored.drops) el.decide(drop.id, drop.essential);
    await el.updateComplete;
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(true);
    expect(events.some((e) => e.type === 'evidence.submitted' && (e.evidence as any).usedFallback === false)).toBe(true);
  });

  it('does not complete while a distractor fills the cup', async () => {
    const { el, events } = mountMechanic('mechanic-rain-gauge', 'mechanic.rain-gauge', 'world.rain-gauge-terrace', authored);
    await el.updateComplete;
    for (const drop of authored.drops) el.decide(drop.id, true);
    await el.updateComplete;
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(false);
  });

  it('falls back to a default scenario when params are malformed', async () => {
    const { el } = mountMechanic('mechanic-rain-gauge', 'mechanic.rain-gauge', 'world.rain-gauge-terrace', { capacity: 'nope' });
    await el.updateComplete;
    expect(el.drops.length).toBeGreaterThan(0);
    expect(el.capacity).toBeGreaterThan(0);
  });

  it('skips via the accessible continue control without granting the lesson', async () => {
    const { el, events } = mountMechanic('mechanic-rain-gauge', 'mechanic.rain-gauge', 'world.rain-gauge-terrace', authored);
    await el.updateComplete;
    el.renderRoot.querySelector('[data-fallback]').click();
    await el.updateComplete;
    expect(events.some((e) => e.type === 'world.skipped')).toBe(true);
    expect(events.some((e) => e.type === 'evidence.submitted' && (e.evidence as any).usedFallback === true)).toBe(true);
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(false);
  });
});