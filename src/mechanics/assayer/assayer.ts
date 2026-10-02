import { html, css, type TemplateResult } from 'lit';
import { MechanicElement } from '../context';
import { parseScenario, type Check, type Item, type Reading, type RelyResult } from './scenario';

export class MechanicAssayer extends MechanicElement {
  static accessibilityDescription =
    'Choose a check to rely on, then mark the unsound weight. A check that cannot fail proves nothing.';

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
    li[data-marked='true'] {
      border-color: #8a1f1f;
    }
    .label {
      flex: 1;
    }
    .reading {
      font-size: 0.85rem;
    }
    .checks {
      display: grid;
      gap: 0.4rem;
      margin-block: 0.5rem;
    }
    .check {
      display: flex;
      gap: 0.5rem;
      align-items: baseline;
    }
    .check[data-relied='true'] {
      font-weight: 600;
    }
    .note {
      font-size: 0.85rem;
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
  `;

  static properties = {
    items: { attribute: false },
    checks: { attribute: false },
    reliedCheck: { attribute: false },
    marked: { attribute: false },
    lastReading: { attribute: false },
    completed: { attribute: false },
  };

  declare items: Item[];
  declare checks: Check[];
  declare reliedCheck: string;
  declare marked: string[];
  declare lastReading: RelyResult | '';
  declare completed: boolean;

  constructor() {
    super();
    const scenario = parseScenario(undefined);
    this.items = scenario.items;
    this.checks = scenario.checks;
    this.reliedCheck = '';
    this.marked = [];
    this.lastReading = '';
    this.completed = false;
  }

  override setContext(context: Parameters<MechanicElement['setContext']>[0]): void {
    const scenario = parseScenario(context.mechanic.params);
    this.items = scenario.items;
    this.checks = scenario.checks;
    this.reliedCheck = '';
    this.marked = [];
    this.lastReading = '';
    this.completed = false;
    super.setContext(context);
  }

  readings(checkId: string): Record<string, Reading> {
    const check = this.checks.find((c) => c.id === checkId);
    const out: Record<string, Reading> = {};
    for (const item of this.items) {
      if (!check || check.kind === 'vanity') out[item.id] = 'sound';
      else if (check.kind === 'broken') out[item.id] = 'unsound';
      else out[item.id] = item.sound ? 'sound' : 'unsound';
    }
    return out;
  }

  /** Rely on a check; a check that cannot fail (or always fails) is refused. */
  relyOn(checkId: string): RelyResult {
    const check = this.checks.find((c) => c.id === checkId);
    if (!check) return 'cannot-fail';
    this.reliedCheck = checkId;
    this.lastReading = check.kind === 'honest' ? 'can-fail' : check.kind === 'broken' ? 'always-fails' : 'cannot-fail';
    this.check();
    this.requestUpdate();
    return this.lastReading;
  }

  markUnsound(itemId: string): void {
    if (!this.items.some((i) => i.id === itemId)) return;
    this.marked = this.marked.includes(itemId) ? this.marked.filter((id) => id !== itemId) : [...this.marked, itemId];
    this.check();
    this.requestUpdate();
  }

  private unsoundIds(): string[] {
    return this.items.filter((item) => !item.sound).map((item) => item.id);
  }

  private check(): void {
    if (this.completed) return;
    const relied = this.checks.find((c) => c.id === this.reliedCheck);
    if (!relied || relied.kind !== 'honest') return;
    const unsound = new Set(this.unsoundIds());
    const marked = new Set(this.marked);
    if (unsound.size === marked.size && [...unsound].every((id) => marked.has(id))) {
      this.completed = true;
      this.emitEvidence({ reliedCheck: this.reliedCheck, marked: [...this.marked], usedFallback: false });
      this.emitComplete();
    }
  }

  renderFallback(): TemplateResult {
    return html`<p>Rely on a check that can fail, then mark the unsound weight.</p>`;
  }

  private readingWords(result: RelyResult | ''): string {
    switch (result) {
      case 'cannot-fail':
        return 'This scale cannot fail, so it proves nothing.';
      case 'always-fails':
        return 'This scale rejects everything, so it proves nothing either.';
      case 'can-fail':
        return 'This check could have disagreed — now it can be trusted.';
      default:
        return '';
    }
  }

  render(): TemplateResult {
    const readings = this.reliedCheck ? this.readings(this.reliedCheck) : {};
    return html`
      <div class="checks">
        ${this.checks.map(
          (check) => html`
            <div class="check" data-relied=${this.reliedCheck === check.id ? 'true' : 'false'}>
              <button type="button" @click=${() => this.relyOn(check.id)}>${check.label}</button>
              ${this.reliedCheck === check.id ? html`<span class="note">relied on</span>` : null}
            </div>
          `,
        )}
      </div>
      <p class="note">${this.readingWords(this.lastReading)}</p>
      <ul>
        ${this.items.map((item) => {
          const reading = readings[item.id];
          return html`
            <li data-marked=${this.marked.includes(item.id) ? 'true' : 'false'}>
              <span class="label">${item.label}</span>
              ${reading ? html`<span class="reading">reads ${reading}</span>` : null}
              <button type="button" @click=${() => this.markUnsound(item.id)}>
                ${this.marked.includes(item.id) ? 'unmark' : 'mark unsound'}
              </button>
            </li>
          `;
        })}
      </ul>
      ${this.renderAccessibleShell()}
    `;
  }
}

customElements.define('mechanic-assayers-scale', MechanicAssayer);