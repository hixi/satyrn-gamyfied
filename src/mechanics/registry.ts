interface Registration {
  ctor: CustomElementConstructor;
  element: string;
}

import { MechanicLantern } from './lantern/lantern';
import { MechanicRainGauge } from './rain-gauge/rain-gauge';
import { MechanicAviary } from './aviary/aviary';
import { MechanicCartwright } from './cartwright/cartwright';

const registry = new Map<string, Registration>();

/** Register a mechanic's element for an id. Idempotent: an existing tag is kept. */
export function defineMechanic(id: string, ctor: CustomElementConstructor, element: string): void {
  registry.set(id, { ctor, element });
  if (!customElements.get(element)) customElements.define(element, ctor);
}

/** The ids of every registered mechanic. */
export function registeredMechanics(): string[] {
  return [...registry.keys()];
}

/** The custom-element tag a mechanic id renders as. */
export function registeredMechanicElement(id: string): string | undefined {
  return registry.get(id)?.element;
}

/**
 * Register the built-in mechanics named by content. Later Beads add one
 * `defineMechanic` line here; nothing else in the app needs to change.
 */
export function registerMechanics(): void {
  defineMechanic('mechanic.lantern', MechanicLantern, 'mechanic-lantern');
  defineMechanic('mechanic.rain-gauge', MechanicRainGauge, 'mechanic-rain-gauge');
  defineMechanic('mechanic.aviary', MechanicAviary, 'mechanic-aviary');
  defineMechanic('mechanic.cartwright', MechanicCartwright, 'mechanic-cartwright');
}