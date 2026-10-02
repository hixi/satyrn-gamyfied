import { describe, it, expect, beforeEach } from 'vitest';
import { Store } from '../../src/store/store';
import { getContent } from '../../src/content';
import '../../src/components/satyrn-app';
import '../../src/components/satyrn-world';
import '../../src/components/satyrn-not-found';

const text = (node: Node): string => {
  if (node.nodeType === 3) return node.textContent ?? '';
  if (node.nodeType !== 1) return '';
  const el = node as Element & { shadowRoot?: ShadowRoot | null };
  if (el.tagName === 'STYLE' || el.tagName === 'SCRIPT') return '';
  const children = el.shadowRoot ? Array.from(el.shadowRoot.childNodes) : Array.from(el.childNodes);
  let out = '';
  for (const child of children) out += text(child);
  return out;
};

describe('shell', () => {
  let store: Store;
  beforeEach(() => {
    window.localStorage.clear();
    store = new Store({ storage: null });
  });

  it('renders a not-found view for an unknown route', async () => {
    const app: any = document.createElement('satyrn-app');
    app.store = store;
    document.body.append(app);
    app.renderRoute({ name: 'notFound', path: 'nonsense' });
    await app.updateComplete;
    expect(text(app)).toMatch(/not found/i);
  });

  it('mounts the registered mechanic for a world', async () => {
    const w: any = document.createElement('satyrn-world');
    w.worldId = 'world.lantern-room';
    document.body.append(w);
    await w.updateComplete;
    expect(w.shadowRoot.querySelector('[data-mechanic]')).toBeTruthy();
  });

  it('lists every content world on the map', async () => {
    const map: any = document.createElement('satyrn-map');
    document.body.append(map);
    await map.updateComplete;
    const worlds = Object.values(getContent().worlds);
    for (const world of worlds) expect(text(map)).toContain(world.title);
  });

  it('the app default store awards content achievements', async () => {
    const app: any = document.createElement('satyrn-app');
    document.body.append(app);
    await app.updateComplete;
    app.store.dispatch({ type: 'mechanic.completed', mechanic: 'mechanic.lantern', world: 'world.lantern-room' });
    expect(app.store.getState().achievements).toContain('achievement.first-light');
  });

  it('records a world as visited when entered through the shell', async () => {
    const app: any = document.createElement('satyrn-app');
    document.body.append(app);
    await app.updateComplete;
    app.renderRoute({ name: 'world', worldId: 'world.lantern-room' });
    await app.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(app.store.getState().visitedWorlds).toContain('world.lantern-room');
  });

  it('swaps the mounted mechanic when the world changes', async () => {
    const w: any = document.createElement('satyrn-world');
    w.store = store;
    w.worldId = 'world.rain-gauge-terrace';
    document.body.append(w);
    await w.updateComplete;
    expect(w.renderRoot.querySelector('mechanic-rain-gauge')).toBeTruthy();

    w.worldId = 'world.aviary-of-whispers';
    await w.updateComplete;
    expect(w.renderRoot.querySelector('mechanic-aviary')).toBeTruthy();
    expect(w.renderRoot.querySelector('mechanic-rain-gauge')).toBeFalsy();
  });
});