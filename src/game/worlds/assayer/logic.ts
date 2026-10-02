import { duplicates, idsOf, isRecord, type ScenarioProblems, validateStarsParam } from '../scenario-helpers';

export type Reading = 'sound' | 'unsound';
export type CheckKind = 'vanity' | 'honest' | 'broken';
export type RelyResult = 'can-fail' | 'cannot-fail' | 'always-fails';

export interface Item {
  id: string;
  label: string;
  sound: boolean;
}

export interface Check {
  id: string;
  label: string;
  kind: CheckKind;
}

const DEFAULT_ITEMS: Item[] = [
  { id: 'millers-measure', label: "the miller's measure", sound: true },
  { id: 'bakers-measure', label: "the baker's measure", sound: true },
  { id: 'cracked-weight', label: 'the cracked weight', sound: false },
  { id: 'ferrymans-measure', label: "the ferryman's measure", sound: true },
];
const DEFAULT_CHECKS: Check[] = [
  { id: 'gleaming', label: 'the gleaming scale', kind: 'vanity' },
  { id: 'assay', label: 'the assay, weighed against a known good', kind: 'honest' },
  { id: 'stubborn', label: 'the stubborn scale', kind: 'broken' },
];

export function parseScenario(params: unknown): { items: Item[]; checks: Check[] } {
  const raw = (params ?? {}) as { items?: unknown; checks?: unknown };
  const items = Array.isArray(raw.items)
    ? raw.items
        .filter((i): i is Record<string, unknown> => !!i && typeof i === 'object')
        .map((i, n) => ({
          id: typeof i.id === 'string' && i.id ? i.id : `item-${n}`,
          label: typeof i.label === 'string' && i.label ? i.label : `item ${n + 1}`,
          sound: i.sound !== false,
        }))
    : [];
  const kinds: CheckKind[] = ['vanity', 'honest', 'broken'];
  const checks = Array.isArray(raw.checks)
    ? raw.checks
        .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
        .map((c, n) => ({
          id: typeof c.id === 'string' && c.id ? c.id : `check-${n}`,
          label: typeof c.label === 'string' && c.label ? c.label : `check ${n + 1}`,
          kind: kinds.includes(c.kind as CheckKind) ? (c.kind as CheckKind) : 'vanity',
        }))
    : [];
  return { items: items.length ? items : DEFAULT_ITEMS, checks: checks.length ? checks : DEFAULT_CHECKS };
}

export function validateScenario(params: unknown): ScenarioProblems {
  const problems: ScenarioProblems = [];
  if (params !== undefined && params !== null && !isRecord(params)) {
    return ['params must be a mapping'];
  }
  const raw = isRecord(params) ? params : {};
  if (raw.items !== undefined && !Array.isArray(raw.items)) problems.push('items must be a list');
  if (raw.checks !== undefined && !Array.isArray(raw.checks)) problems.push('checks must be a list');

  const { items, checks } = parseScenario(params);
  for (const id of duplicates(idsOf(items))) problems.push(`duplicate item id: ${id}`);
  for (const id of duplicates(idsOf(checks))) problems.push(`duplicate check id: ${id}`);

  if (!items.some((item) => !item.sound)) problems.push('nothing to find: every weight is sound');
  if (!checks.some((check) => check.kind === 'honest')) {
    problems.push('unsolvable: no honest check, so no reading can be trusted');
  }
  problems.push(...validateStarsParam(params, { required: true }));
  return problems;
}