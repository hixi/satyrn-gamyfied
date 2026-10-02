import { html, css, type TemplateResult } from 'lit';
import { MechanicElement } from '../context';
import { parseScenario, type Clause, type ClauseKind } from './scenario';

/** The Blueprint and the Mason: a spec the Mason can build and check. */
export class MechanicBlueprint extends MechanicElement {
  static accessibilityDescription =
    'Choose clauses to form a spec, then ask the Mason to build. Only measurable clauses can be built and checked.';

  static styles = css`
    :host {
      display: block;
    }
    ul {
      list-style: none;
      margin: 0.5rem 0;
      padding: 0;
      display: grid;
      gap: 0.4rem;
    }
    li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.5rem;
      border: 1px solid var(--satyrn-charcoal, #383330);
      border-radius: 0.35rem;
    }
    li[data-chosen='true'] {
      border-color: var(--satyrn-yellow-ui, #816928);
      background: color-mix(in srgb, var(--satyrn-yellow, #e3d678) 20%, white);
    }
    .marker {
      font-size: 0.8rem;
      color: var(--satyrn-yellow-dark, #433715);
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
    blueprint: { attribute: false },
    clauses: { attribute: false },
    spec: { attribute: false },
    lastBuild: { attribute: false },
    completed: { attribute: false },
  };

  declare blueprint: { width: number; height: number };
  declare clauses: Clause[];
  declare spec: string[];
  declare lastBuild: 'vague' | 'correct' | 'wrong-size' | '';
  declare completed: boolean;

  constructor() {
    super();
    const scenario = parseScenario(undefined);
    this.blueprint = scenario.blueprint;
    this.clauses = scenario.clauses;
    this.spec = [];
    this.lastBuild = '';
    this.completed = false;
  }

  override setContext(context: Parameters<MechanicElement['setContext']>[0]): void {
    const scenario = parseScenario(context.mechanic.params);
    this.blueprint = scenario.blueprint;
    this.clauses = scenario.clauses;
    this.spec = [];
    this.lastBuild = '';
    this.completed = false;
    super.setContext(context);
  }

  choose(clauseId: string): void {
    if (this.completed || !this.clauses.some((c) => c.id === clauseId)) return;
    this.spec = this.spec.includes(clauseId) ? this.spec.filter((id) => id !== clauseId) : [...this.spec, clauseId];
    this.emitProgress(Math.min(1, this.spec.length / 2));
    this.lastBuild = '';
    this.requestUpdate();
  }

  private lastChosen(kind: ClauseKind): Clause | undefined {
    let found: Clause | undefined;
    for (const id of this.spec) {
      const clause = this.clauses.find((c) => c.id === id);
      if (clause && clause.kind === kind) found = clause;
    }
    return found;
  }

  /** Ask the Mason to build from the current spec. */
  build(): 'vague' | 'correct' | 'wrong-size' {
    const width = this.lastChosen('width');
    const height = this.lastChosen('height');
    let result: 'vague' | 'correct' | 'wrong-size';
    if (!width || !height || width.value === undefined || height.value === undefined) {
      result = 'vague';
    } else if (width.value === this.blueprint.width && height.value === this.blueprint.height) {
      result = 'correct';
      if (!this.completed) {
        this.completed = true;
        this.emitEvidence({ spec: [...this.spec], build: { width: width.value, height: height.value }, usedFallback: false });
        this.emitComplete();
      }
    } else {
      result = 'wrong-size';
    }
    this.lastBuild = result;
    this.requestUpdate();
    return result;
  }

  renderFallback(): TemplateResult {
    return html`<p>Choose measurable clauses that match the drawing, then ask the Mason to build.</p>`;
  }

  private buildWords(result: 'vague' | 'correct' | 'wrong-size' | ''): string {
    switch (result) {
      case 'vague':
        return 'The Mason waits: there is nothing here she can measure.';
      case 'wrong-size':
        return 'The mason begins — and builds the wrong wall.';
      case 'correct':
        return 'the mason begins, and the wall matches the drawing.';
      default:
        return '';
    }
  }

  render(): TemplateResult {
    return html`
      <p>The drawing: ${this.blueprint.width} bricks wide, ${this.blueprint.height} high.</p>
      <ul>
        ${this.clauses.map(
          (clause) => html`
            <li data-chosen=${this.spec.includes(clause.id) ? 'true' : 'false'}>
              <button type="button" @click=${() => this.choose(clause.id)}>
                ${this.spec.includes(clause.id) ? '✓' : '+'} ${clause.text}
              </button>
              <span class="marker">${clause.kind === 'vague' ? 'cannot be measured' : 'measurable'}</span>
            </li>
          `,
        )}
      </ul>
      <button type="button" @click=${() => this.build()}>Ask the Mason to build</button>
      ${this.lastBuild ? html`<p class="result">${this.buildWords(this.lastBuild)}</p>` : null}
      ${this.renderAccessibleShell()}
    `;
  }
}

customElements.define('mechanic-blueprint', MechanicBlueprint);