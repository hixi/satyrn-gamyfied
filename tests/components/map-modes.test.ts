import { describe, it, expect } from 'vitest';
import { getContent } from '../../src/content';
import { Store } from '../../src/store/store';
import '../../src/components/satyrn-map';

const text = (el: Element) => (el as any).shadowRoot.textContent as string;

function mount(mode: 'thread' | 'wander', visited: string[] = []) {
  const store = new Store({ storage: null, achievements: Object.values(getContent().achievements) });
  for (const world of visited) store.dispatch({ type: 'world.entered', world });
  const map: any = document.createElement('satyrn-map');
  map.store = store;
  map.mode = mode;
  document.body.append(map);
  return map;
}

describe('map modes', () => {
  it('thread mode marks the next unvisited Bead and offers to continue', async () => {
    const map = mount('thread', ['world.lantern-room']);
    await map.updateComplete;
    expect(text(map)).toContain('Continue the Thread');
    expect(text(map)).toContain('Rain-Gauge');
    expect(map.shadowRoot.querySelector('[data-next="true"] a')?.getAttribute('href')).toBe(
      '#/world/world.rain-gauge-terrace',
    );
  });

  it('thread mode lists every Bead in sequence order', async () => {
    const map = mount('thread');
    await map.updateComplete;
    const seq = getContent().threads['thread.main'].sequence;
    const hrefs = [...map.shadowRoot.querySelectorAll('a')].map((a: any) => a.getAttribute('href'));
    for (const id of seq) expect(hrefs).toContain(`#/world/${id}`);
  });

  it('thread mode says so when the Thread is walked', async () => {
    const map = mount('thread', getContent().threads['thread.main'].sequence);
    await map.updateComplete;
    expect(text(map)).toMatch(/walked the whole Thread/i);
    expect(map.shadowRoot.querySelector('[data-next="true"]')).toBeNull();
  });

  it('wander mode groups by act and offers no next CTA', async () => {
    const map = mount('wander');
    await map.updateComplete;
    expect(text(map)).toContain('Act I');
    expect(text(map)).not.toContain('Continue the Thread');
  });
});