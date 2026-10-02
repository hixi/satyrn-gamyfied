import { duplicates, idsOf, isRecord, isPositiveNumber, type ScenarioProblems, validateStarsParam } from '../scenario-helpers';

export type ClauseKind = 'width' | 'height' | 'vague';

export interface Clause {
  id: string;
  text: string;
  kind: ClauseKind;
  value?: number;
}

const DEFAULT_BLUEPRINT = { width: 60, height: 20 };
const DEFAULT_CLAUSES: Clause[] = [
  { id: 'w60', text: '60 bricks wide', kind: 'width', value: 60 },
  { id: 'w40', text: '40 bricks wide', kind: 'width', value: 40 },
  { id: 'h20', text: '20 bricks high', kind: 'height', value: 20 },
  { id: 'h30', text: '30 bricks high', kind: 'height', value: 30 },
  { id: 'sturdy', text: 'sturdy enough', kind: 'vague' },
  { id: 'about-right', text: 'looks about right', kind: 'vague' },
];

export function parseScenario(params: unknown): { blueprint: { width: number; height: number }; clauses: Clause[] } {
  const raw = (params ?? {}) as { blueprint?: unknown; clauses?: unknown };
  const bp = (raw.blueprint ?? {}) as Record<string, unknown>;
  const blueprint = {
    width: isPositiveNumber(bp.width) ? bp.width : DEFAULT_BLUEPRINT.width,
    height: isPositiveNumber(bp.height) ? bp.height : DEFAULT_BLUEPRINT.height,
  };
  const kinds: ClauseKind[] = ['width', 'height', 'vague'];
  const clauses = Array.isArray(raw.clauses)
    ? raw.clauses
        .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
        .map((c, i) => ({
          id: typeof c.id === 'string' && c.id ? c.id : `clause-${i}`,
          text: typeof c.text === 'string' && c.text ? c.text : `clause ${i + 1}`,
          kind: kinds.includes(c.kind as ClauseKind) ? (c.kind as ClauseKind) : 'vague',
          value: typeof c.value === 'number' ? c.value : undefined,
        }))
    : [];
  return { blueprint, clauses: clauses.length ? clauses : DEFAULT_CLAUSES };
}

export function validateScenario(params: unknown): ScenarioProblems {
  const problems: ScenarioProblems = [];
  if (params !== undefined && params !== null && !isRecord(params)) {
    return ['params must be a mapping'];
  }
  const raw = isRecord(params) ? params : {};
  if (raw.clauses !== undefined && !Array.isArray(raw.clauses)) problems.push('clauses must be a list');

  const { blueprint, clauses } = parseScenario(params);
  for (const id of duplicates(idsOf(clauses))) problems.push(`duplicate clause id: ${id}`);

  const hasWidth = clauses.some((c) => c.kind === 'width' && c.value === blueprint.width);
  const hasHeight = clauses.some((c) => c.kind === 'height' && c.value === blueprint.height);
  if (!hasWidth) problems.push(`unsolvable: no width clause of ${blueprint.width}`);
  if (!hasHeight) problems.push(`unsolvable: no height clause of ${blueprint.height}`);
  problems.push(...validateStarsParam(params, { required: true }));
  return problems;
}