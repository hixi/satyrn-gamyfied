import { describe, it, expect } from 'vitest';
import { getContent } from '../../src/content';
import { registerMechanics } from '../../src/mechanics/registry';
import { mountMechanic } from './helper';

registerMechanics();
const authored = getContent().mechanics['mechanic.aviary'].params as any;

describe('aviary', () => {
  it('completes when every task is assigned a distinct suitable bird', async () => {
    const { el, events } = mountMechanic('mechanic-aviary', 'mechanic.aviary', 'world.aviary-of-whispers', authored);
    await el.updateComplete;
    el.solve();
    await el.updateComplete;
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(true);
    expect(events.some((e) => e.type === 'evidence.submitted' && (e.evidence as any).usedFallback === false)).toBe(true);
  });

  it('rejects reusing one bird for two tasks', async () => {
    const { el, events } = mountMechanic('mechanic-aviary', 'mechanic.aviary', 'world.aviary-of-whispers', authored);
    await el.updateComplete;
    const [t1, t2] = el.tasks;
    const bird = authored.birds[0].id;
    el.assign(t1.id, bird);
    el.assign(t2.id, bird);
    await el.updateComplete;
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(false);
    expect(el.conflicts().length).toBe(1);
  });

  it('falls back to a default scenario when params are malformed', async () => {
    const { el } = mountMechanic('mechanic-aviary', 'mechanic.aviary', 'world.aviary-of-whispers', { birds: 'nope' });
    await el.updateComplete;
    expect(el.birds.length).toBeGreaterThan(0);
    expect(el.tasks.length).toBeGreaterThan(0);
  });

  it('completes via the accessible continue control', async () => {
    const { el, events } = mountMechanic('mechanic-aviary', 'mechanic.aviary', 'world.aviary-of-whispers', authored);
    await el.updateComplete;
    el.renderRoot.querySelector('[data-fallback]').click();
    await el.updateComplete;
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(true);
  });
});