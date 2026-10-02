import { duplicates, idsOf, isRecord, isPositiveNumber, type ScenarioProblems } from '../scenario';

export type ComponentType = 'work' | 'limit' | 'verify' | 'distraction';

export interface Component {
  id: string;
  name: string;
  type: ComponentType;
  power?: number;
  limit?: number;
}

export interface Slot {
  id: string;
  label: string;
}

export type RunResult = 'success' | 'overshot' | 'ran-out' | 'no-work';

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

export function parseScenario(params: unknown): { goal: number; slots: Slot[]; components: Component[] } {
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

export function simulate(goal: number, chosen: Record<string, Component>): RunResult {
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

export function isSolvable(goal: number, components: Component[]): boolean {
  const works = components.filter((c) => c.type === 'work');
  const limits = components.filter((c) => c.type === 'limit');
  const checks = components.filter((c) => c.type === 'verify');
  for (const work of works) {
    for (const limit of limits) {
      for (const check of checks) {
        if (simulate(goal, { work, limit, check }) === 'success') return true;
      }
    }
  }
  return false;
}

export function validateScenario(params: unknown): ScenarioProblems {
  const problems: ScenarioProblems = [];
  if (params !== undefined && params !== null && !isRecord(params)) {
    return ['params must be a mapping'];
  }
  const raw = isRecord(params) ? params : {};
  if (raw.goal !== undefined && !isPositiveNumber(raw.goal)) problems.push('goal must be a positive number');
  if (raw.slots !== undefined && !Array.isArray(raw.slots)) problems.push('slots must be a list');
  if (raw.components !== undefined && !Array.isArray(raw.components)) problems.push('components must be a list');

  const { goal, components } = parseScenario(params);
  for (const id of duplicates(idsOf(components))) problems.push(`duplicate component id: ${id}`);

  if (!components.some((c) => c.type === 'work')) problems.push('unsolvable: no work component');
  if (!components.some((c) => c.type === 'verify')) problems.push('unsolvable: no verify component, so the cart cannot stop');
  if (!components.some((c) => c.type === 'limit')) problems.push('unsolvable: no limit component, so the loop never ends');
  else if (!isSolvable(goal, components)) problems.push(`unsolvable: no rig reaches a market at ${goal}`);
  return problems;
}