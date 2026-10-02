import { describe, it, expect } from 'vitest';
import { getContent } from '../../src/content';
import { registerMechanics } from '../../src/mechanics/registry';
import { mountMechanic } from './helper';

registerMechanics();
const authored = getContent().mechanics['mechanic.assayers-scale'].params as any;
const honest = () => authored.checks.find((c: any) => c.kind === 'honest');
const unsoundIds = () => authored.items.filter((i: any) => !i.sound).map((i: any) => i.id);

describe('assayer scale', () => {
  it('the vanity check cannot fail and is refused', async () => {
    const { el, events } = mountMechanic('mechanic-assayers-scale', 'mechanic.assayers-scale', 'world.assayers-scale', authored);
    await el.updateComplete;
    const vanity = authored.checks.find((c: any) => c.kind === 'vanity');
    const readings = el.readings(vanity.id);
    expect(Object.values(readings).every((r) => r === 'sound')).toBe(true);
    expect(el.relyOn(vanity.id)).toBe('cannot-fail');
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(false);
  });

  it('the honest check reveals the unsound item', async () => {
    const { el } = mountMechanic('mechanic-assayers-scale', 'mechanic.assayers-scale', 'world.assayers-scale', authored);
    await el.updateComplete;
    const readings = el.readings(honest().id);
    for (const id of unsoundIds()) expect(readings[id]).toBe('unsound');
    expect(el.relyOn(honest().id)).toBe('can-fail');
  });

  it('completes only when an honest check is relied on and the unsound item is marked', async () => {
    const { el, events } = mountMechanic('mechanic-assayers-scale', 'mechanic.assayers-scale', 'world.assayers-scale', authored);
    await el.updateComplete;
    el.relyOn(honest().id);
    for (const id of unsoundIds()) el.markUnsound(id);
    await el.updateComplete;
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(true);
    expect(events.some((e) => e.type === 'evidence.submitted' && (e.evidence as any).usedFallback === false)).toBe(true);
  });

  it('falls back to a default scenario when params are malformed', async () => {
    const { el } = mountMechanic('mechanic-assayers-scale', 'mechanic.assayers-scale', 'world.assayers-scale', { checks: 1 });
    await el.updateComplete;
    expect(el.items.length).toBeGreaterThan(0);
    expect(el.checks.length).toBeGreaterThan(0);
  });

  it('skips via the accessible continue control without granting the lesson', async () => {
    const { el, events } = mountMechanic('mechanic-assayers-scale', 'mechanic.assayers-scale', 'world.assayers-scale', authored);
    await el.updateComplete;
    el.renderRoot.querySelector('[data-fallback]').click();
    await el.updateComplete;
    expect(events.some((e) => e.type === 'world.skipped')).toBe(true);
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(false);
  });
});