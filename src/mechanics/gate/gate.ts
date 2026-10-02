import { html, css, type TemplateResult } from 'lit';
import { MechanicElement } from '../context';
import { admits, parseScenario, type Order, type Traveller } from './scenario';

export class MechanicGate extends MechanicElement {
  static accessibilityDescription =
    'Choose one standing order. The gate applies it literally to every traveller and reports which cases fail.';

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
      padding: 0.5rem;
      border: 1px solid var(--satyrn-charcoal, #383330);
      border-radius: 0.35rem;
    }
    li[data-pass='true'] {
      border-color: var(--satyrn-yellow-ui, #816928);
      background: color-mix(in srgb, var(--satyrn-yellow, #e3d678) 20%, white);
    }
    label {
      display: flex;
      gap: 0.5rem;
      align-items: baseline;
      cursor: pointer;
    }
    .status {
      display: block;
      margin-block-start: 0.25rem;
      font-size: 0.85rem;
    }
    .fail {
      color: #8a1f1f;
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
    travellers: { attribute: false },
    orders: { attribute: false },
    selectedOrder: { attribute: false },
    lastFailures: { attribute: false },
    completed: { attribute: false },
  };

  declare travellers: Traveller[];
  declare orders: Order[];
  declare selectedOrder: string;
  declare lastFailures: string[];
  declare completed: boolean;

  constructor() {
    super();
    const scenario = parseScenario(undefined);
    this.travellers = scenario.travellers;
    this.orders = scenario.orders;
    this.selectedOrder = '';
    this.lastFailures = [];
    this.completed = false;
  }

  override setContext(context: Parameters<MechanicElement['setContext']>[0]): void {
    const scenario = parseScenario(context.mechanic.params);
    this.travellers = scenario.travellers;
    this.orders = scenario.orders;
    this.selectedOrder = '';
    this.lastFailures = [];
    this.completed = false;
    super.setContext(context);
  }

  private failuresFor(order: Order): string[] {
    return this.travellers
      .filter((traveller) => admits(order, traveller) !== traveller.shouldEnter)
      .map((traveller) => traveller.id);
  }

  /** Apply an order literally; complete when every traveller is handled correctly. */
  chooseOrder(orderId: string): { passed: boolean; failures: string[] } {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return { passed: false, failures: [] };
    const failures = this.failuresFor(order);
    this.selectedOrder = orderId;
    this.lastFailures = failures;
    this.emitProgress((this.travellers.length - failures.length) / this.travellers.length);
    if (failures.length === 0 && !this.completed) {
      this.completed = true;
      this.emitEvidence({ orderId, failures: [], usedFallback: false });
      this.emitComplete();
    }
    this.requestUpdate();
    return { passed: failures.length === 0, failures };
  }

  readings(): { orderId: string; failures: string[] }[] {
    return this.orders.map((order) => ({ orderId: order.id, failures: this.failuresFor(order) }));
  }

  private labelFor(id: string): string {
    return this.travellers.find((t) => t.id === id)?.label ?? id;
  }

  renderFallback(): TemplateResult {
    return html`<p>Choose the one order that admits exactly those who should enter.</p>`;
  }

  render(): TemplateResult {
    return html`
      <ul>
        ${this.orders.map((order) => {
          const tried = this.selectedOrder === order.id;
          const failures = tried ? this.lastFailures : [];
          const pass = tried && failures.length === 0;
          return html`
            <li data-pass=${pass ? 'true' : 'false'}>
              <label>
                <input
                  type="radio"
                  name="order"
                  .checked=${tried}
                  @change=${() => this.chooseOrder(order.id)}
                />
                <span>${order.text}</span>
              </label>
              <span class="status ${pass ? '' : tried ? 'fail' : ''}">
                ${!tried
                  ? 'not yet tried'
                  : pass
                    ? 'every case is handled'
                    : `fails: ${failures.map((id) => this.labelFor(id)).join(', ')}`}
              </span>
            </li>
          `;
        })}
      </ul>
      ${this.renderAccessibleShell()}
    `;
  }
}

customElements.define('mechanic-gate', MechanicGate);