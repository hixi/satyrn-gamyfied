import { html, css, type TemplateResult } from 'lit';
import { MechanicElement } from '../context';

type ComponentType = 'work' | 'limit' | 'verify' | 'distraction';

interface Component {
  id: string;
  name: string;
  type: ComponentType;
  power?: number;
  limit?: number;
}

interface Slot {
  id: string;
  label: string;
}

type RunResult = 'success' | 'overshot' | 'ran-out' | 'no-work';

const DEFAULT_GOAL = 8;
const DEFAULT_SLOTS: Slot[] = [
  { id: 'work', label: 'how it works' },
  { id: 'limit', label: 'how far it may go' },
  { id: 'check', label: 'how it knows it arrived' },
];
const DEFAULT_COMPONENTS: Component[] = [
  { id: 'steady', name: 'a steady work tool', type: 'work', power: 2 },
  { id: 'tiny', name: 'a tiny work tool', type: 'work', power: 1 },
  { id: 'budget', name: 'a turn budget', type: 'limit', limit: 12 },
  { id: 'nudge', name: 'a gentle nudge', type: 'distraction' },
  { id: 'marker', name: 'a market marker', type: 'verify' },
  { id: 'bell', name: 'a pretty bell', type: 'distraction' },
];

function parseScenario(params: unknown): { goal: number; slots: Slot[]; components: Component[] } {
  const raw = (params ?? {}) as { goal?: unknown; slots?: unknown; components?: unknown };
  const goal = typeof raw.goal === 'number' && raw.goal > 0 ? raw.goal : DEFAULT_GOAL;
  const slots = Array.isArray(raw.slots)
    ? raw.slots
        .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
        .map((s, i) => ({
          id: typeof s.id === 'string' && s.id ? s.id : `slot-${i}`,
          label: typeof s.label === 'string' && s.label ? s.label : `slot ${i + 1}`,
        }))
    : [];
  const types: ComponentType[] = ['work', 'limit', 'verify', 'distraction'];
  const components = Array.isArray(raw.components)
    ? raw.components
        .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
        .map((c, i) => {
          const type = types.includes(c.type as ComponentType) ? (c.type as ComponentType) : 'distraction';
          return {
            id: typeof c.id === 'string' && c.id ? c.id : `component-${i}`,
            name: typeof c.name === 'string' && c.name ? c.name : `component ${i + 1}`,
            type,
            power: typeof c.power === 'number' ? c.power : undefined,
            limit: typeof c.limit === 'number' ? c.limit : undefined,
          };
        })
    : [];
  return {
    goal,
    slots: slots.length ? slots : DEFAULT_SLOTS,
    components: components.length ? components : DEFAULT_COMPONENTS,
  };
}

function simulate(goal: number, chosen: Record<string, Component>): RunResult {
  const work = chosen['work'];
  if (!work || work.type !== 'work') return 'no-work';
  const power = work.power ?? 1;
  const verifies = chosen['check']?.type === 'verify';
  const limitComponent = chosen['limit'];
  const hasLimit = limitComponent?.type === 'limit';

  // Without a check it never knows it has arrived; however far it gets, it does
  // not stop there.
  if (!verifies) {
    const reach = 40 * power;
    return reach >= goal ? 'overshot' : 'ran-out';
  }
  // It knows it has arrived, but only a limit ends the loop.
  if (!hasLimit) return 'ran-out';

  const max = limitComponent?.limit ?? 40;
  let position = 0;
  for (let i = 0; i < max; i++) {
    position += power;
    if (position >= goal) return 'success';
  }
  return 'ran-out';
}

/** The Cartwright's Yard: build a harness that reaches the market and stops there. */
export class MechanicCartwright extends MechanicElement {
  static accessibilityDescription =
    'Three slots: a work tool, a limit on how far the cart may go, and a check that knows when it arrived. Fit them so the cart reaches the market and stops.';

  static styles = css`
    :host {
      display: block;
    }
    ul {
      list-style: none;
      margin: 0.5rem 0;
      padding: 0;
      display: grid;
      gap: 0.5rem;
    }
    li {
      display: grid;
      gap: 0.3rem;
      padding: 0.5rem;
      border: 1px solid var(--satyrn-charcoal, #383330);
      border-radius: 0.35rem;
    }
    select {
      font: inherit;
      padding: 0.25rem;
    }
    .result {
      font-weight: 600;
    }
    button {
      font: inherit;
      border: 1px solid var(--satyrn-charcoal, #383330);
      border-radius: 0.35rem;
      padding: 0.3rem 0.7rem;
      background: white;
      cursor: pointer;
    }
  `;

  static properties = {
    goal: { attribute: false },
    slots: { attribute: false },
    components: { attribute: false },
    chosen: { attribute: false },
    lastResult: { attribute: false },
    completed: { attribute: false },
  };

  declare goal: number;
  declare slots: Slot[];
  declare components: Component[];
  declare chosen: Record<string, string>;
  declare lastResult: RunResult | '';
  declare completed: boolean;

  constructor() {
    super();
    const scenario = parseScenario(undefined);
    this.goal = scenario.goal;
    this.slots = scenario.slots;
    this.components = scenario.components;
    this.chosen = {};
    this.lastResult = '';
    this.completed = false;
  }

  override setContext(context: Parameters<MechanicElement['setContext']>[0]): void {
    const scenario = parseScenario(context.mechanic.params);
    this.goal = scenario.goal;
    this.slots = scenario.slots;
    this.components = scenario.components;
    this.chosen = {};
    this.lastResult = '';
    this.completed = false;
    super.setContext(context);
  }

  setSlot(slotId: string, componentId: string): void {
    this.chosen = { ...this.chosen, [slotId]: componentId };
    this.lastResult = '';
    const fitted = this.slots.filter((slot) => this.chosen[slot.id]).length;
    this.emitProgress(fitted / this.slots.length);
    this.requestUpdate();
  }

  private chosenComponents(): Record<string, Component> {
    const out: Record<string, Component> = {};
    for (const slot of this.slots) {
      const component = this.components.find((c) => c.id === this.chosen[slot.id]);
      if (component) out[slot.id] = component;
    }
    return out;
  }

  /** Run the rig once. Deterministic: no timers, no randomness. */
  run(): RunResult {
    const result = simulate(this.goal, this.chosenComponents());
    this.lastResult = result;
    if (result === 'success' && !this.completed) {
      this.completed = true;
      this.emitEvidence({ result, usedFallback: false });
      this.emitComplete();
    }
    this.requestUpdate();
    return result;
  }

  renderFallback(): TemplateResult {
    return html`<p>Fit a work tool, a limit, and a check so the cart reaches the market and stops.</p>`;
  }

  private resultWords(result: RunResult | ''): string {
    switch (result) {
      case 'success':
        return 'The cart reached the market and stopped.';
      case 'overshot':
        return 'The cart bolted straight past the market.';
      case 'ran-out':
        return 'The cart ran out of road before the market.';
      case 'no-work':
        return 'Nothing turns the wheels.';
      default:
        return '';
    }
  }

  render(): TemplateResult {
    return html`
      <p>The market lies ${this.goal} leagues on.</p>
      <ul>
        ${this.slots.map((slot) => {
          const selected = this.chosen[slot.id] ?? '';
          return html`
            <li>
              <label for=${`slot-${slot.id}`}>${slot.label}</label>
              <select
                id=${`slot-${slot.id}`}
                .value=${selected}
                @change=${(event: Event) => this.setSlot(slot.id, (event.target as HTMLSelectElement).value)}
              >
                <option value="">— choose a component —</option>
                ${this.components.map((component) => html`<option value=${component.id}>${component.name}</option>`)}
              </select>
            </li>
          `;
        })}
      </ul>
      <button type="button" @click=${() => this.run()}>Send the cart</button>
      ${this.lastResult ? html`<p class="result">${this.resultWords(this.lastResult)}</p>` : null}
      ${this.renderAccessibleShell()}
    `;
  }
}

customElements.define('mechanic-cartwright', MechanicCartwright);