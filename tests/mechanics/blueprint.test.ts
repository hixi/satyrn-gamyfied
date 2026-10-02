import { describe, it, expect } from 'vitest';
import { getContent } from '../../src/content';
import { registerMechanics } from '../../src/mechanics/registry';
import { mountMechanic } from './helper';

registerMechanics();
const authored = getContent().mechanics['mechanic.blueprint'].params as any;
const widthClause = (v: number) => authored.clauses.find((c: any) => c.kind === 'width' && c.value === v);
const heightClause = (v: number) => authored.clauses.find((c: any) => c.kind === 'height' && c.value === v);

describe('blueprint', () => {
  it('builds nothing from a spec with no measurements', async () => {
    const { el, events } = mountMechanic('mechanic-blueprint', 'mechanic.blueprint', 'world.blueprint-and-mason', authored);
    await el.updateComplete;
    const vague = authored.clauses.find((c: any) => c.kind === 'vague');
    el.choose(vague.id);
    expect(el.build()).toBe('vague');
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(false);
  });

  it('builds the wrong size from measurable but incorrect clauses', async () => {
    const { el } = mountMechanic('mechanic-blueprint', 'mechanic.blueprint', 'world.blueprint-and-mason', authored);
    await el.updateComplete;
    const wrongWidth = authored.clauses.find((c: any) => c.kind === 'width' && c.value !== authored.blueprint.width);
    el.choose(wrongWidth.id);
    el.choose(heightClause(authored.blueprint.height).id);
    expect(el.build()).toBe('wrong-size');
  });

  it('completes with the authored measurable clauses that match the blueprint', async () => {
    const { el, events } = mountMechanic('mechanic-blueprint', 'mechanic.blueprint', 'world.blueprint-and-mason', authored);
    await el.updateComplete;
    el.choose(widthClause(authored.blueprint.width).id);
    el.choose(heightClause(authored.blueprint.height).id);
    expect(el.build()).toBe('correct');
    await el.updateComplete;
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(true);
    expect(events.some((e) => e.type === 'evidence.submitted' && (e.evidence as any).usedFallback === false)).toBe(true);
  });

  it('does not reveal a passing spec before it is built', async () => {
    const { el } = mountMechanic('mechanic-blueprint', 'mechanic.blueprint', 'world.blueprint-and-mason', authored);
    await el.updateComplete;
    expect(el.lastBuild).toBe('');
    expect(el.shadowRoot.querySelector('.result')).toBeFalsy();
    const text = el.shadowRoot.textContent ?? '';
    for (const phrase of ['mason begins', 'matches the drawing']) {
      expect(text).not.toContain(phrase);
    }
  });

  it('falls back to a default scenario when params are malformed', async () => {
    const { el } = mountMechanic('mechanic-blueprint', 'mechanic.blueprint', 'world.blueprint-and-mason', { blueprint: 1 });
    await el.updateComplete;
    expect(el.clauses.length).toBeGreaterThan(0);
    expect(el.blueprint.width).toBeGreaterThan(0);
  });

  it('skips via the accessible continue control without granting the lesson', async () => {
    const { el, events } = mountMechanic('mechanic-blueprint', 'mechanic.blueprint', 'world.blueprint-and-mason', authored);
    await el.updateComplete;
    el.renderRoot.querySelector('[data-fallback]').click();
    await el.updateComplete;
    expect(events.some((e) => e.type === 'world.skipped')).toBe(true);
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(false);
  });
});