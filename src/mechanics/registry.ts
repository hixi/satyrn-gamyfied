import { MechanicLantern } from './lantern/lantern';
import { MechanicRainGauge } from './rain-gauge/rain-gauge';
import { MechanicAviary } from './aviary/aviary';
import { MechanicCartwright } from './cartwright/cartwright';
import { MechanicRoundPath } from './round-path/round-path';
import { MechanicGate } from './gate/gate';
import { MechanicAssayer } from './assayer/assayer';
import { MechanicBlueprint } from './blueprint/blueprint';
import { MechanicWell } from './well/well';
import { MechanicGarden } from './garden/garden';

interface Registration {
  ctor: CustomElementConstructor;
  element: string;
}

const registry = new Map<string, Registration>();

/** Register a mechanic's element for an id. Idempotent: an existing tag is kept. */
export function defineMechanic(id: string, ctor: CustomElementConstructor, element: string): void {
  registry.set(id, { ctor, element });
  if (!customElements.get(element)) customElements.define(element, ctor);
}

export function registeredMechanics(): string[] {
  return [...registry.keys()];
}

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
  defineMechanic('mechanic.round-path', MechanicRoundPath, 'mechanic-round-path');
  defineMechanic('mechanic.gate-of-orders', MechanicGate, 'mechanic-gate');
  defineMechanic('mechanic.assayers-scale', MechanicAssayer, 'mechanic-assayers-scale');
  defineMechanic('mechanic.blueprint', MechanicBlueprint, 'mechanic-blueprint');
  defineMechanic('mechanic.well-and-pipe', MechanicWell, 'mechanic-well');
  defineMechanic('mechanic.commons-garden', MechanicGarden, 'mechanic-garden');
}