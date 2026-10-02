import { html, css, type TemplateResult } from 'lit';
import { MechanicElement } from '../context';

interface Traveller {
  id: string;
  label: string;
  attributes: string[];
  shouldEnter: boolean;
}

interface Order {
  id: string;
  text: string;
  allow: string[];
  deny: string[];
}

const DEFAULT_TRAVELLERS: Traveller[] = [
  { id: 'merchant-lantern', label: 'the merchant with a lantern', attributes: ['merchant', 'lantern'], shouldEnter: true },
  { id: 'merchant-dark', label: 'the merchant with no lantern', attributes: ['merchant'], shouldEnter: false },
  { id: 'pilgrim-lantern', label: 'the pilgrim with a lantern', attributes: ['pilgrim', 'lantern'], shouldEnter: true },
  { id: 'pilgrim-dark', label: 'the pilgrim with no lantern', attributes: ['pilgrim'], shouldEnter: false },
];
const DEFAULT_ORDERS: Order[] = [
  { id: 'any-lantern', text: 'Admit anyone carrying a lantern.', allow: ['lantern'], deny: [] },
  { id: 'merchants-only', text: 'Admit merchants; turn away pilgrims.', allow: ['merchant'], deny: [] },
  { id: 'everyone', text: 'Admit everyone, and turn away no one.', allow: [], deny: [] },
  { id: 'carrying-nothing', text: 'Admit only those who carry nothing.', allow: [], deny: ['lantern'] },
];

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function parseScenario(params: unknown): { travellers: Traveller[]; orders: Order[] } {
  const raw = (params ?? {}) as { travellers?: unknown; orders?: unknown };
  const travellers = Array.isArray(raw.travellers)
    ? raw.travellers
        .filter((t): t is Record<string, unknown> => !!t && typeof t === 'object')
        .map((t, i) => ({
          id: typeof t.id === 'string' && t.id ? t.id : `traveller-${i}`,
          label: typeof t.label === 'string' && t.label ? t.label : `traveller ${i + 1}`,
          attributes: stringList(t.attributes),
          shouldEnter: t.shouldEnter === true,
        }))
    : [];
  const orders = Array.isArray(raw.orders)
    ? raw.orders
        .filter((o): o is Record<string, unknown> => !!o && typeof o === 'object')
        .map((o, i) => ({
          id: typeof o.id === 'string' && o.id ? o.id : `order-${i}`,
          text: typeof o.text === 'string' && o.text ? o.text : `order ${i + 1}`,
          allow: stringList(o.allow),
          deny: stringList(o.deny),
        }))
    : [];
  return {
    travellers: travellers.length ? travellers : DEFAULT_TRAVELLERS,
    orders: orders.length ? orders : DEFAULT_ORDERS,
  };
}

/** The Gate of Orders: find the literal order that survives every edge case. */
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

  private admits(order: Order, traveller: Traveller): boolean {
    return (
      order.allow.every((a) => traveller.attributes.includes(a)) &&
      order.deny.every((d) => !traveller.attributes.includes(d))
    );
  }

  private failuresFor(order: Order): string[] {
    return this.travellers
      .filter((traveller) => this.admits(order, traveller) !== traveller.shouldEnter)
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

  /** Every order's failures, for a live comparison. */
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