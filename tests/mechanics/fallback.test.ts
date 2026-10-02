import { describe, it, expect } from 'vitest';
import { getContent } from '../../src/content';
import { Store } from '../../src/store/store';
import { registerMechanics } from '../../src/mechanics/registry';
import type { MechanicContext } from '../../src/mechanics/context';

registerMechanics();

function mountWithStore(tag: string, mechanicId: string, worldId: string) {
  const content = getContent();
  const el: any = document.createElement(tag);
  const store = new Store({ storage: null, achievements: Object.values(content.achievements) });
  const context: MechanicContext = {
    mechanic: content.mechanics[mechanicId],
    world: content.worlds[worldId],
    content: { getConcept: (id) => content.concepts[id], getCharacter: (id) => content.characters[id] },
    store,
    dialogue: { open: () => {} },
  };
  el.setContext(context);
  document.body.append(el);
  return { el, store };
}

describe('the accessible fallback path', () => {
  it('records an honest skip and awards the skip achievement', async () => {
    const { el, store } = mountWithStore('mechanic-lantern', 'mechanic.lantern', 'world.lantern-room');
    await el.updateComplete;
    el.renderRoot.querySelector('[data-fallback]').click();
    await el.updateComplete;
    expect(store.getState().skippedWorlds).toContain('world.lantern-room');
    expect(store.getState().achievements).toContain('achievement.wanderer');
  });

  it('does not grant the lesson to a skip', async () => {
    const { el, store } = mountWithStore('mechanic-lantern', 'mechanic.lantern', 'world.lantern-room');
    await el.updateComplete;
    el.renderRoot.querySelector('[data-fallback]').click();
    await el.updateComplete;
    expect(store.getState().completedMechanics).not.toContain('mechanic.lantern');
    expect(store.getState().achievements).not.toContain('achievement.first-light');
  });

  it('acknowledges a skip in every world, not only the prologue', async () => {
    const { el, store } = mountWithStore('mechanic-aviary', 'mechanic.aviary', 'world.aviary-of-whispers');
    await el.updateComplete;
    el.renderRoot.querySelector('[data-fallback]').click();
    await el.updateComplete;
    expect(store.getState().skippedWorlds).toContain('world.aviary-of-whispers');
    expect(store.getState().achievements).toContain('achievement.wanderer');
  });
});