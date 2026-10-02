import { html, css, type TemplateResult } from 'lit';
import { MechanicElement } from '../context';
import { parseScenario, type Step } from './scenario';

export class MechanicRoundPath extends MechanicElement {
  static accessibilityDescription =
    'A numbered list of the mule’s steps. Select the steps that make up one full turn of the repeating circle, then break the loop.';

  static styles = css`
    :host {
      display: block;
    }
    ol {
      list-style: none;
      margin: 0.5rem 0;
      padding: 0;
      display: grid;
      gap: 0.3rem;
      counter-reset: step;
    }
    li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.5rem;
      border: 1px solid var(--satyrn-charcoal, #383330);
      border-radius: 0.35rem;
    }
    li[data-selected='true'] {
      border-color: var(--satyrn-yellow-ui, #816928);
      background: color-mix(in srgb, var(--satyrn-yellow, #e3d678) 25%, white);
    }
    .num {
      inline-size: 1.6rem;
      color: var(--satyrn-yellow-dark, #433715);
    }
    .work {
      font-size: 0.8rem;
      color: var(--satyrn-yellow-dark, #433715);
    }
    button {
      font: inherit;
      border: 1px solid var(--satyrn-charcoal, #383330);
      border-radius: 0.35rem;
      padding: 0.3rem 0.7rem;
      background: white;
      cursor: pointer;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
      margin-block-start: 0.5rem;
    }
  `;

  static properties = {
    steps: { attribute: false },
    cycleStart: { attribute: false },
    cycleLength: { attribute: false },
    selection: { attribute: false },
    completed: { attribute: false },
  };

  declare steps: Step[];
  declare cycleStart: number;
  declare cycleLength: number;
  declare selection: string[];
  declare completed: boolean;

  constructor() {
    super();
    const scenario = parseScenario(undefined);
    this.steps = scenario.steps;
    this.cycleStart = scenario.cycleStart;
    this.cycleLength = scenario.cycleLength;
    this.selection = [];
    this.completed = false;
  }

  override setContext(context: Parameters<MechanicElement['setContext']>[0]): void {
    const scenario = parseScenario(context.mechanic.params);
    this.steps = scenario.steps;
    this.cycleStart = scenario.cycleStart;
    this.cycleLength = scenario.cycleLength;
    this.selection = [];
    this.completed = false;
    super.setContext(context);
  }

  select(id: string): void {
    if (this.completed) return;
    this.selection = this.selection.includes(id) ? this.selection.filter((s) => s !== id) : [...this.selection, id];
    this.emitProgress(Math.min(1, this.selection.length / this.cycleLength));
    this.requestUpdate();
  }

  private blockIds(): string[] {
    return this.steps.slice(this.cycleStart, this.cycleStart + this.cycleLength).map((s) => s.id);
  }

  breakLoop(): 'broken' | 'wrong-loop' | 'not-selected' {
    if (!this.selection.length) return 'not-selected';
    const block = new Set(this.blockIds());
    const chosen = new Set(this.selection);
    const exact = chosen.size === block.size && [...block].every((id) => chosen.has(id));
    if (!exact) return 'wrong-loop';
    if (!this.completed) {
      this.completed = true;
      this.emitEvidence({ cycleStart: this.cycleStart, cycleLength: this.cycleLength, brokeAt: this.cycleStart, usedFallback: false });
      this.emitComplete();
    }
    this.requestUpdate();
    return 'broken';
  }

  /** Stop the mule outright: the wrong turn — it loses the morning's work. */
  stopMule(): 'stopped' {
    this.selection = [];
    this.requestUpdate();
    return 'stopped';
  }

  renderFallback(): TemplateResult {
    return html`<p>Select one full turn of the repeating circle, then break the loop.</p>`;
  }

  render(): TemplateResult {
    return html`
      <ol>
        ${this.steps.map((step, i) => {
          const selected = this.selection.includes(step.id);
          const isWork = i < this.cycleStart;
          return html`
            <li data-selected=${selected ? 'true' : 'false'}>
              <span class="num">${i + 1}.</span>
              <button type="button" @click=${() => this.select(step.id)}>${step.label}</button>
              ${isWork ? html`<span class="work">this morning’s work</span>` : null}
            </li>
          `;
        })}
      </ol>
      <div class="actions">
        <button type="button" @click=${() => this.breakLoop()}>Break the loop</button>
        <button type="button" @click=${() => this.stopMule()}>Stop the mule</button>
      </div>
      ${this.renderAccessibleShell()}
    `;
  }
}

customElements.define('mechanic-round-path', MechanicRoundPath);