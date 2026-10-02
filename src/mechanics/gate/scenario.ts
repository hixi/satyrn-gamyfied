import { duplicates, idsOf, isRecord, type ScenarioProblems } from '../scenario';

export interface Traveller {
  id: string;
  label: string;
  attributes: string[];
  shouldEnter: boolean;
}

export interface Order {
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

export function parseScenario(params: unknown): { travellers: Traveller[]; orders: Order[] } {
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

/** The gate is perfectly literal: an order admits a traveller iff it has all
 * `allow` attributes and none of its `deny` attributes. */
export function admits(order: Order, traveller: Traveller): boolean {
  return (
    order.allow.every((a) => traveller.attributes.includes(a)) &&
    order.deny.every((d) => !traveller.attributes.includes(d))
  );
}

/** Orders that handle every traveller exactly as they should. */
export function passingOrders(travellers: Traveller[], orders: Order[]): Order[] {
  return orders.filter((order) => travellers.every((t) => admits(order, t) === t.shouldEnter));
}

export function validateScenario(params: unknown): ScenarioProblems {
  const problems: ScenarioProblems = [];
  if (params !== undefined && params !== null && !isRecord(params)) {
    return ['params must be a mapping'];
  }
  const raw = isRecord(params) ? params : {};
  if (raw.travellers !== undefined && !Array.isArray(raw.travellers)) problems.push('travellers must be a list');
  if (raw.orders !== undefined && !Array.isArray(raw.orders)) problems.push('orders must be a list');

  const { travellers, orders } = parseScenario(params);
  for (const id of duplicates(idsOf(travellers))) problems.push(`duplicate traveller id: ${id}`);
  for (const id of duplicates(idsOf(orders))) problems.push(`duplicate order id: ${id}`);

  const passing = passingOrders(travellers, orders);
  if (passing.length === 0) problems.push('unsolvable: no order admits exactly those who should enter');
  else if (passing.length > 1) {
    problems.push(`ambiguous: ${passing.length} orders pass (${passing.map((o) => o.id).join(', ')}); the puzzle wants exactly one`);
  }
  return problems;
}