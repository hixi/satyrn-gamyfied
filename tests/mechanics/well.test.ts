import { describe, it, expect } from 'vitest';
import { getContent } from '../../src/content';
import { registerMechanics } from '../../src/mechanics/registry';
import { mountMechanic } from './helper';

registerMechanics();
const authored = getContent().mechanics['mechanic.well-and-pipe'].params as any;
const sensitive = () => authored.tasks.filter((t: any) => t.sensitive);
const plain = () => authored.tasks.filter((t: any) => !t.sensitive);

describe('well and pipe', () => {
  it('the authored scenario is solvable and every solution keeps sensitive tasks on the well', async () => {
    const n = authored.tasks.length;
    const solutions: number[] = [];
    for (let mask = 0; mask < 1 << n; mask++) {
      const well = authored.tasks.filter((_: any, i: number) => mask & (1 << i));
      const allSensitiveOnWell = sensitive().every((t: any) => well.some((w: any) => w.id === t.id));
      const used = well.reduce((sum: number, t: any) => sum + t.need, 0);
      if (allSensitiveOnWell && used <= authored.wellCapacity) solutions.push(mask);
    }
    expect(solutions.length).toBeGreaterThan(0);
  });

  it('completes with sensitive tasks on the well and plain tasks on the pipe', async () => {
    const { el, events } = mountMechanic('mechanic-well', 'mechanic.well-and-pipe', 'world.well-and-pipe', authored);
    await el.updateComplete;
    for (const t of sensitive()) el.assign(t.id, 'well');
    for (const t of plain()) el.assign(t.id, 'pipe');
    expect(el.check().ok).toBe(true);
    await el.updateComplete;
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(true);
  });

  it('reports a sensitive task sent to the pipe', async () => {
    const { el, events } = mountMechanic('mechanic-well', 'mechanic.well-and-pipe', 'world.well-and-pipe', authored);
    await el.updateComplete;
    for (const t of authored.tasks) el.assign(t.id, 'pipe');
    const result = el.check();
    expect(result.ok).toBe(false);
    expect(result.problems.some((p: string) => p.includes(sensitive()[0].id))).toBe(true);
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(false);
  });

  it('reports the well overflowing', async () => {
    const { el } = mountMechanic('mechanic-well', 'mechanic.well-and-pipe', 'world.well-and-pipe', authored);
    await el.updateComplete;
    for (const t of authored.tasks) el.assign(t.id, 'well');
    expect(el.check().problems.some((p: string) => /capacity/i.test(p))).toBe(true);
  });

  it('falls back to a default scenario when params are malformed', async () => {
    const { el } = mountMechanic('mechanic-well', 'mechanic.well-and-pipe', 'world.well-and-pipe', { wellCapacity: 'x' });
    await el.updateComplete;
    expect(el.tasks.length).toBeGreaterThan(0);
    expect(el.wellCapacity).toBeGreaterThan(0);
  });

  it('skips via the accessible continue control without granting the lesson', async () => {
    const { el, events } = mountMechanic('mechanic-well', 'mechanic.well-and-pipe', 'world.well-and-pipe', authored);
    await el.updateComplete;
    el.renderRoot.querySelector('[data-fallback]').click();
    await el.updateComplete;
    expect(events.some((e) => e.type === 'world.skipped')).toBe(true);
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(false);
  });
});