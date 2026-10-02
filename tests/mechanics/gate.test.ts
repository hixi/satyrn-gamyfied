import { describe, it, expect } from 'vitest';
import { getContent } from '../../src/content';
import { registerMechanics } from '../../src/mechanics/registry';
import { mountMechanic } from './helper';

registerMechanics();
const authored = getContent().mechanics['mechanic.gate-of-orders'].params as any;
const passingOrder = () =>
  authored.orders.find((o: any) => {
    const admits = (t: any) =>
      o.allow.every((a: string) => t.attributes.includes(a)) && o.deny.every((d: string) => !t.attributes.includes(d));
    return authored.travellers.every((t: any) => admits(t) === t.shouldEnter);
  });

describe('gate of orders', () => {
  it('the authored scenario has exactly one order that passes every case', async () => {
    const passing = authored.orders.filter((o: any) => {
      const admits = (t: any) =>
        o.allow.every((a: string) => t.attributes.includes(a)) && o.deny.every((d: string) => !t.attributes.includes(d));
      return authored.travellers.every((t: any) => admits(t) === t.shouldEnter);
    });
    expect(passing.length).toBe(1);
  });

  it('completes when the passing order is chosen', async () => {
    const { el, events } = mountMechanic('mechanic-gate', 'mechanic.gate-of-orders', 'world.gate-of-orders', authored);
    await el.updateComplete;
    const result = el.chooseOrder(passingOrder().id);
    expect(result.passed).toBe(true);
    await el.updateComplete;
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(true);
  });

  it('rejects an order that fails an edge case and names it', async () => {
    const { el, events } = mountMechanic('mechanic-gate', 'mechanic.gate-of-orders', 'world.gate-of-orders', authored);
    await el.updateComplete;
    const failing = authored.orders.find((o: any) => o.id !== passingOrder().id);
    const result = el.chooseOrder(failing.id);
    expect(result.passed).toBe(false);
    expect(result.failures.length).toBeGreaterThan(0);
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(false);
  });

  it('falls back to a default scenario when params are malformed', async () => {
    const { el } = mountMechanic('mechanic-gate', 'mechanic.gate-of-orders', 'world.gate-of-orders', { travellers: 5 });
    await el.updateComplete;
    expect(el.orders.length).toBeGreaterThan(0);
    expect(el.travellers.length).toBeGreaterThan(0);
  });

  it('does not reveal which order passes before it is tried', async () => {
    const { el } = mountMechanic('mechanic-gate', 'mechanic.gate-of-orders', 'world.gate-of-orders', authored);
    await el.updateComplete;
    expect(el.shadowRoot.textContent).not.toContain('every case is handled');
  });

  it('completes via the accessible continue control', async () => {
    const { el, events } = mountMechanic('mechanic-gate', 'mechanic.gate-of-orders', 'world.gate-of-orders', authored);
    await el.updateComplete;
    el.renderRoot.querySelector('[data-fallback]').click();
    await el.updateComplete;
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(true);
  });
});