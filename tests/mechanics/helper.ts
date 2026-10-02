import { createInitialState, applyEvent, type GameState } from '../../src/store/state';
import { getContent } from '../../src/content';
import type { MechanicContext } from '../../src/mechanics/context';

/**
 * Mount a mechanic behind a recorded, event-applying store. When `params` is
 * given it replaces the content mechanic's params for this mount, so tests can
 * inject custom or malformed scenarios. `state` overrides the initial persisted
 * state (e.g. settings).
 */
export function mountMechanic(
  tag: string,
  mechanicId: string,
  worldId: string,
  params?: Record<string, unknown>,
  state?: Partial<GameState>,
) {
  const el: any = document.createElement(tag);
  const events: any[] = [];
  let current: GameState = { ...createInitialState(), ...state };
  const listeners = new Set<(s: GameState) => void>();
  const content = getContent();
  const base = content.mechanics[mechanicId];
  const context: MechanicContext = {
    mechanic: params === undefined ? base : { ...base, params },
    world: content.worlds[worldId],
    content: { getConcept: (id) => content.concepts[id], getCharacter: (id) => content.characters[id] },
    store: {
      getState: () => current,
      subscribe: (fn) => {
        listeners.add(fn);
        return () => {
          listeners.delete(fn);
        };
      },
      dispatch: (e) => {
        events.push(e);
        current = applyEvent(current, e);
        for (const fn of listeners) fn(current);
      },
    },
    dialogue: { open: () => {} },
  };
  el.setContext(context);
  document.body.append(el);
  return { el, events };
}