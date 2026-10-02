import { html, css, type TemplateResult } from 'lit';
import { MechanicElement } from '../context';
import { parseScenario, type Drop } from './scenario';

/** The Rain-Gauge: a fixed-size cup, more drops than room. Keep only what is needed. */
export class MechanicRainGauge extends MechanicElement {
  static accessibilityDescription =
    'A cup that holds a fixed number of raindrops. For each drop choose Keep or Let fall; the plants need particular ones.';

  static styles = css`
    :host {
      display: block;
    }
    ul {
      list-style: none;
      margin: 0.5rem 0;
      padding: 0;
      display: grid;
      gap: 0.35rem;
    }
    li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.5rem;
      border: 1px solid var(--satyrn-charcoal, #383330);
      border-radius: 0.35rem;
    }
    li[data-decided='true'] {
      opacity: 0.7;
    }
    li[data-kept='true'] {
      border-color: var(--satyrn-yellow-ui, #816928);
      background: color-mix(in srgb, var(--satyrn-yellow, #e3d678) 25%, white);
    }
    .label {
      flex: 1;
    }
    button {
      font: inherit;
      border: 1px solid var(--satyrn-charcoal, #383330);
      border-radius: 0.35rem;
      padding: 0.25rem 0.6rem;
      background: white;
      cursor: pointer;
    }
    button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
    .cup {
      font-weight: 600;
    }
  `;

  static properties = {
    capacity: { attribute: false },
    drops: { attribute: false },
    kept: { attribute: false },
    decided: { attribute: false },
    completed: { attribute: false },
  };

  declare capacity: number;
  declare drops: Drop[];
  declare kept: string[];
  declare decided: string[];
  declare completed: boolean;

  private essentialIds = new Set<string>();

  constructor() {
    super();
    const scenario = parseScenario(undefined);
    this.capacity = scenario.capacity;
    this.drops = scenario.drops;
    this.essentialIds = new Set(scenario.drops.filter((d) => d.essential).map((d) => d.id));
    this.kept = [];
    this.decided = [];
    this.completed = false;
  }

  override setContext(context: Parameters<MechanicElement['setContext']>[0]): void {
    const scenario = parseScenario(context.mechanic.params);
    this.capacity = scenario.capacity;
    this.drops = scenario.drops;
    this.essentialIds = new Set(scenario.drops.filter((d) => d.essential).map((d) => d.id));
    this.kept = [];
    this.decided = [];
    this.completed = false;
    super.setContext(context);
  }

  /** Decide one drop: keep it in the cup, or let it fall. */
  decide(id: string, keep: boolean): void {
    if (this.completed || this.decided.includes(id)) return;
    if (keep && this.kept.length >= this.capacity) return;
    if (keep) this.kept = [...this.kept, id];
    this.decided = [...this.decided, id];
    this.emitProgress(this.decided.length / this.drops.length);
    if (this.decided.length === this.drops.length) this.settle();
    this.requestUpdate();
  }

  private settle(): void {
    const keptSet = new Set(this.kept);
    const keptOnlyEssentials = this.kept.length === this.essentialIds.size;
    const hasEveryEssential = [...this.essentialIds].every((id) => keptSet.has(id));
    if (keptOnlyEssentials && hasEveryEssential && !this.completed) {
      this.completed = true;
      this.emitEvidence({ kept: [...this.kept], spilled: this.spilled(), usedFallback: false });
      this.emitComplete();
    }
  }

  spilled(): string[] {
    return this.drops.filter((d) => !this.kept.includes(d.id)).map((d) => d.id);
  }

  private retry(): void {
    this.kept = [];
    this.decided = [];
    this.completed = false;
    this.requestUpdate();
  }

  renderFallback(): TemplateResult {
    return html`<p>Choose which drops to keep. The cup holds ${this.capacity}.</p>`;
  }

  private renderDrop(drop: Drop) {
    const decided = this.decided.includes(drop.id);
    const kept = this.kept.includes(drop.id);
    const cupFull = this.kept.length >= this.capacity;
    return html`
      <li data-decided=${decided ? 'true' : 'false'} data-kept=${kept ? 'true' : 'false'}>
        <span class="label">${drop.label}</span>
        <button type="button" ?disabled=${decided || cupFull} @click=${() => this.decide(drop.id, true)}>Keep</button>
        <button type="button" ?disabled=${decided} @click=${() => this.decide(drop.id, false)}>Let fall</button>
      </li>
    `;
  }

  render(): TemplateResult {
    const finished = this.decided.length === this.drops.length;
    return html`
      <p class="cup">Cup: ${this.kept.length} / ${this.capacity}</p>
      <ul>
        ${this.drops.map((drop) => this.renderDrop(drop))}
      </ul>
      ${finished && !this.completed
        ? html`<p>The cup is full of the wrong things. <button type="button" @click=${() => this.retry()}>Try again</button></p>`
        : null}
      ${this.renderAccessibleShell()}
    `;
  }
}

customElements.define('mechanic-rain-gauge', MechanicRainGauge);