import { describe, it, expect } from 'vitest';
import { getContent } from '../../src/content';
import { registerMechanics } from '../../src/mechanics/registry';
import { mountMechanic } from './helper';

registerMechanics();
const authored = getContent().mechanics['mechanic.commons-garden'].params as any;

describe('commons garden', () => {
  it('refuses to plant an unnamed Bead', async () => {
    const { el } = mountMechanic('mechanic-garden', 'mechanic.commons-garden', 'world.commons-garden', authored);
    await el.updateComplete;
    el.chooseSeed(authored.seeds[0].id);
    expect(el.plant()).toBe('unnamed');
  });

  it('refuses to plant a whitespace-only name', async () => {
    const { el } = mountMechanic('mechanic-garden', 'mechanic.commons-garden', 'world.commons-garden', authored);
    await el.updateComplete;
    el.setName('   ');
    el.chooseSeed(authored.seeds[0].id);
    expect(el.plant()).toBe('unnamed');
  });

  it('requires a seed', async () => {
    const { el } = mountMechanic('mechanic-garden', 'mechanic.commons-garden', 'world.commons-garden', authored);
    await el.updateComplete;
    el.setName('The Quiet Forge');
    expect(el.plant()).toBe('no-seed');
  });

  it('completes after visiting a community Bead and planting', async () => {
    const { el, events } = mountMechanic('mechanic-garden', 'mechanic.commons-garden', 'world.commons-garden', authored);
    await el.updateComplete;
    el.visit(authored.communityBeads[0].id);
    el.setName('The Quiet Forge');
    el.chooseSeed(authored.seeds[authored.seeds.length - 1].id);
    expect(el.plant()).toBe('planted');
    await el.updateComplete;
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(true);
    expect(events.some((e) => e.type === 'evidence.submitted' && (e.evidence as any).usedFallback === false)).toBe(true);
  });

  it('does not complete by planting without visiting the commons', async () => {
    const { el, events } = mountMechanic('mechanic-garden', 'mechanic.commons-garden', 'world.commons-garden', authored);
    await el.updateComplete;
    el.setName('The Quiet Forge');
    el.chooseSeed(authored.seeds[0].id);
    el.plant();
    await el.updateComplete;
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(false);
  });

  it('falls back to a default scenario when params are malformed', async () => {
    const { el } = mountMechanic('mechanic-garden', 'mechanic.commons-garden', 'world.commons-garden', { seeds: 0 });
    await el.updateComplete;
    expect(el.seeds.length).toBeGreaterThan(0);
    expect(el.communityBeads.length).toBeGreaterThan(0);
  });

  it('completes via the accessible continue control', async () => {
    const { el, events } = mountMechanic('mechanic-garden', 'mechanic.commons-garden', 'world.commons-garden', authored);
    await el.updateComplete;
    el.renderRoot.querySelector('[data-fallback]').click();
    await el.updateComplete;
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(true);
  });
});