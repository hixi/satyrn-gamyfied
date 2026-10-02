import { describe, it, expect } from 'vitest';
import { registerMechanics, registeredMechanics } from '../../src/mechanics/registry';
import { createInitialState, applyEvent } from '../../src/store/state';
import { getContent } from '../../src/content';

registerMechanics();

function mount() {
  const el: any = document.createElement('mechanic-lantern');
  const events: any[] = [];
  let state = createInitialState();
  const context = {
    mechanic: { id: 'mechanic.lantern', element: 'mechanic-lantern', title: 't', description: 'd', a11y: 'a', params: {} },
    world: { id: 'world.lantern-room', title: 'w', act: 'prologue', order: 0, concepts: [], mechanic: 'mechanic.lantern', summary: 's', intro: 'i' },
    content: { getConcept: () => undefined, getCharacter: () => undefined },
    store: {
      getState: () => state,
      subscribe: () => () => {},
      dispatch: (e: any) => {
        events.push(e);
        state = applyEvent(state, e);
      },
    },
    dialogue: { open: () => {} },
  };
  el.setContext(context);
  document.body.append(el);
  return { el, events };
}

describe('lantern mechanic', () => {
  it('registers every mechanic named by content', () => {
    for (const id of Object.keys(getContent().mechanics)) {
      expect(registeredMechanics()).toContain(id);
    }
  });

  it('completes with keyboard input only', async () => {
    const { el, events } = mount();
    await el.updateComplete;
    const spots = el.requiredSpots ?? [];
    expect(spots.length).toBeGreaterThan(0);
    el.focus();
    for (let i = 0; i < spots.length; i++) {
      el.moveToSpot(i);
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
    }
    expect(events.some((e) => e.type === 'mechanic.completed' && e.mechanic === 'mechanic.lantern')).toBe(true);
    expect(events.some((e) => e.type === 'evidence.submitted' && (e.evidence as any).usedFallback === false)).toBe(true);
  });

  it('completes via the accessible continue control', async () => {
    const { el, events } = mount();
    await el.updateComplete;
    const button = el.shadowRoot.querySelector('[data-fallback]');
    button.click();
    await el.updateComplete;
    expect(events.some((e) => e.type === 'mechanic.completed')).toBe(true);
    expect(events.some((e) => e.type === 'evidence.submitted' && (e.evidence as any).usedFallback === true)).toBe(true);
  });
});