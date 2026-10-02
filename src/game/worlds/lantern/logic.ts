import { isRecord, validateStarsParam, type ScenarioProblems } from '../scenario-helpers';

export interface Spot {
  id: string;
  label: string;
}

const DEFAULT_SPOTS: Spot[] = [
  { id: 'bench', label: 'the workbench' },
  { id: 'shelf', label: 'the shelf' },
  { id: 'hearth', label: 'the hearth' },
  { id: 'door', label: 'the door' },
];

export function parseScenario(params: unknown): { spots: Spot[] } {
  const raw = isRecord(params) ? params : {};
  const spots = Array.isArray(raw.spots)
    ? raw.spots
        .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
        .map((s, i) => ({
          id: typeof s.id === 'string' && s.id ? s.id : `spot-${i}`,
          label: typeof s.label === 'string' && s.label ? s.label : `spot ${i + 1}`,
        }))
    : [];
  return { spots: spots.length ? spots : DEFAULT_SPOTS };
}

export function validateScenario(params: unknown): ScenarioProblems {
  const problems: ScenarioProblems = [];
  if (params !== undefined && params !== null && !isRecord(params)) {
    return ['params must be a mapping'];
  }
  const raw = isRecord(params) ? params : {};
  if (raw.spots !== undefined && !Array.isArray(raw.spots)) problems.push('spots must be a list');
  const { spots } = parseScenario(params);
  if (spots.length === 0) problems.push('unsolvable: no spots to light');
  problems.push(...validateStarsParam(params, { required: true }));
  return problems;
}
