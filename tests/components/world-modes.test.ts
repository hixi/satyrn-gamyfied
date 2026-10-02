import { describe, it, expect } from 'vitest';
import { getContent } from '../../src/content';
import { Store } from '../../src/store/store';
import '../../src/components/satyrn-world';

const text = (el: Element) => (el as any).shadowRoot.textContent as string;

function mount(worldId: string, mode: 'thread' | 'wander') {
  const store = new Store({ storage: null, achievements: Object.values(getContent().achievements) });
  const world: any = document.createElement('satyrn-world');
  world.worldId = worldId;
  world.store = store;
  world.mode = mode;
  document.body.append(world);
  return world;
}

describe('world modes', () => {
  it('thread mode links on to the next Bead in sequence', async () => {
    const world = mount('world.lantern-room', 'thread');
    await world.updateComplete;
    expect(text(world)).toContain('Continue the Thread');
    expect(world.shadowRoot.querySelector('[data-next-bead]')?.getAttribute('href')).toBe(
      '#/world/world.rain-gauge-terrace',
    );
  });

  it('thread mode ends cleanly on the last Bead', async () => {
    const world = mount('world.commons-garden', 'thread');
    await world.updateComplete;
    expect(world.shadowRoot.querySelector('[data-next-bead]')).toBeNull();
    expect(text(world)).toMatch(/walked the whole Thread/i);
  });

  it('wander mode shows no thread footer', async () => {
    const world = mount('world.lantern-room', 'wander');
    await world.updateComplete;
    expect(world.shadowRoot.querySelector('[data-next-bead]')).toBeNull();
    expect(text(world)).not.toContain('Continue the Thread');
  });
});