import { html, css, type TemplateResult } from 'lit';
import { MechanicElement } from '../context';
import { parseScenario, simulate, type Component, type Slot, type RunResult } from './scenario';

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