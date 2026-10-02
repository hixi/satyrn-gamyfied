import { duplicates, idsOf, isRecord, type ScenarioProblems, validateStarsParam } from '../scenario-helpers';

export interface Drop {
  id: string;
  label: string;
  essential: boolean;
}

export const DEFAULT_CAPACITY = 5;
export const DEFAULT_DROPS: Drop[] = [
  { id: 'seed', label: 'seed', essential: true },
  { id: 'chatter', label: 'chatter', essential: false },
  { id: 'root', label: 'root', essential: true },
  { id: 'rumour', label: 'rumour', essential: false },
  { id: 'shoot', label: 'shoot', essential: true },
  { id: 'echo', label: 'echo', essential: false },
  { id: 'bloom', label: 'bloom', essential: true },
  { id: 'harvest', label: 'harvest', essential: true },
];

export function parseScenario(params: unknown): { capacity: number; drops: Drop[] } {
  const raw = (params ?? {}) as { capacity?: unknown; drops?: unknown };
  const capacity =
    typeof raw.capacity === 'number' && Number.isInteger(raw.capacity) && raw.capacity > 0 ? raw.capacity : DEFAULT_CAPACITY;
  const drops = Array.isArray(raw.drops)
    ? raw.drops
        .filter((d): d is Record<string, unknown> => !!d && typeof d === 'object')
        .map((d, i) => ({
          id: typeof d.id === 'string' && d.id ? d.id : `drop-${i}`,
          label: typeof d.label === 'string' && d.label ? d.label : `drop ${i + 1}`,
          essential: d.essential === true,
        }))
    : [];
  return { capacity, drops: drops.length ? drops : DEFAULT_DROPS };
}

export function validateScenario(params: unknown): ScenarioProblems {
  const problems: ScenarioProblems = [];
  if (params !== undefined && params !== null && !isRecord(params)) {
    return ['params must be a mapping'];
  }
  const { capacity, drops } = parseScenario(params);
  const raw = isRecord(params) ? params : {};

  if (raw.capacity !== undefined && (!Number.isInteger(raw.capacity) || (raw.capacity as number) <= 0)) {
    problems.push('capacity must be a positive integer');
  }
  if (raw.drops !== undefined && !Array.isArray(raw.drops)) {
    problems.push('drops must be a list');
  }
  for (const id of duplicates(idsOf(drops))) problems.push(`duplicate drop id: ${id}`);

  const essentials = drops.filter((d) => d.essential).length;
  if (essentials > capacity) {
    problems.push(`unsolvable: ${essentials} essential drops do not fit a cup of ${capacity}`);
  }
  problems.push(...validateStarsParam(params, { required: true }));
  return problems;
}