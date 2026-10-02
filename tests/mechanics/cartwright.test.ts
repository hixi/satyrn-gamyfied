import { describe, it, expect } from 'vitest';
import { getContent } from '../../src/content';
import { registerMechanics } from '../../src/mechanics/registry';
import { mountMechanic } from './helper';

registerMechanics();
const authored = getContent().mechanics['mechanic.cartwright'].params as any;
const byType = (t: string) => authored.components.find((c: any) => c.type === t);

describe('cartwright', () => {
  it('reaches the market and stops with work, limit and verify fitted', async () => {
    const { el, events } = mountMechanic('mechanic-cartwright', 'mechanic.cartwright', 'world.cartwrights-yard', authored);
    await el.updateComplete;
    el.setSlot('work', byType('work').id);
    el.setSlot('limit', byType('limit').id);
    el.setSlot('check', byType('verify').id);
    expect(el.run()).toBe('success');
    await el.updateComplete;
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(true);
    expect(events.some((e) => e.type === 'evidence.submitted' && (e.evidence as any).usedFallback === false)).toBe(true);
  });

  it('bolts past the market without a verifier', async () => {
    const { el, events } = mountMechanic('mechanic-cartwright', 'mechanic.cartwright', 'world.cartwrights-yard', authored);
    await el.updateComplete;
    el.setSlot('work', byType('work').id);
    el.setSlot('limit', byType('limit').id);
    expect(el.run()).toBe('overshot');
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(false);
  });

  it('runs out of road without a limit', async () => {
    const { el } = mountMechanic('mechanic-cartwright', 'mechanic.cartwright', 'world.cartwrights-yard', authored);
    await el.updateComplete;
    el.setSlot('work', byType('work').id);
    el.setSlot('check', byType('verify').id);
    expect(el.run()).toBe('ran-out');
  });

  it('falls back to a default scenario when params are malformed', async () => {
    const { el } = mountMechanic('mechanic-cartwright', 'mechanic.cartwright', 'world.cartwrights-yard', { goal: 'x' });
    await el.updateComplete;
    expect(el.slots.length).toBeGreaterThan(0);
    expect(el.components.length).toBeGreaterThan(0);
  });

  it('completes via the accessible continue control', async () => {
    const { el, events } = mountMechanic('mechanic-cartwright', 'mechanic.cartwright', 'world.cartwrights-yard', authored);
    await el.updateComplete;
    el.renderRoot.querySelector('[data-fallback]').click();
    await el.updateComplete;
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(true);
  });
});