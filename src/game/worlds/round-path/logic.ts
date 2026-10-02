import { duplicates, idsOf, isRecord, isPositiveInt, type ScenarioProblems, validateStarsParam } from '../scenario-helpers';

export interface Step {
  id: string;
  label: string;
}

const DEFAULT_STEPS: Step[] = [
  { id: 'fetch-grain', label: 'fetch grain' },
  { id: 'grind-flour', label: 'grind flour' },
  { id: 'bag-flour', label: 'bag flour' },
  { id: 'pat-post', label: 'pat the post' },
  { id: 'find-nothing', label: 'find nothing new' },
];
const DEFAULT_CYCLE_START = 3;
const DEFAULT_CYCLE_LENGTH = 2;

export function parseScenario(params: unknown): { steps: Step[]; cycleStart: number; cycleLength: number } {
  const raw = (params ?? {}) as { steps?: unknown; cycleStart?: unknown; cycleLength?: unknown };
  const steps = Array.isArray(raw.steps)
    ? raw.steps
        .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
        .map((s, i) => ({
          id: typeof s.id === 'string' && s.id ? s.id : `step-${i}`,
          label: typeof s.label === 'string' && s.label ? s.label : `step ${i + 1}`,
        }))
    : [];
  const resolved = steps.length ? steps : DEFAULT_STEPS;
  const cycleLength =
    typeof raw.cycleLength === 'number' && raw.cycleLength > 0 && raw.cycleLength <= resolved.length
      ? raw.cycleLength
      : Math.min(DEFAULT_CYCLE_LENGTH, resolved.length);
  const cycleStart =
    typeof raw.cycleStart === 'number' && raw.cycleStart >= 0 && raw.cycleStart + cycleLength <= resolved.length
      ? raw.cycleStart
      : Math.max(0, resolved.length - cycleLength);
  return { steps: resolved, cycleStart, cycleLength };
}

export function validateScenario(params: unknown): ScenarioProblems {
  const problems: ScenarioProblems = [];
  if (params !== undefined && params !== null && !isRecord(params)) {
    return ['params must be a mapping'];
  }
  const raw = isRecord(params) ? params : {};

  if (raw.steps !== undefined && !Array.isArray(raw.steps)) problems.push('steps must be a list');
  if (raw.cycleStart !== undefined && (!Number.isInteger(raw.cycleStart) || (raw.cycleStart as number) < 0)) {
    problems.push('cycleStart must be a non-negative integer');
  }
  if (raw.cycleLength !== undefined && !isPositiveInt(raw.cycleLength)) {
    problems.push('cycleLength must be a positive integer');
  }

  const { steps, cycleStart, cycleLength } = parseScenario(params);
  for (const id of duplicates(idsOf(steps))) problems.push(`duplicate step id: ${id}`);

  // Validate the authored values, not the clamped parse, so an out-of-range
  // cycle is reported rather than silently replaced by the default.
  const effectiveStart = Number.isInteger(raw.cycleStart) && (raw.cycleStart as number) >= 0 ? (raw.cycleStart as number) : cycleStart;
  const effectiveLength = isPositiveInt(raw.cycleLength) ? raw.cycleLength : cycleLength;
  if (effectiveLength > steps.length) problems.push('cycleLength is longer than the list of steps');
  if (effectiveStart + effectiveLength > steps.length) {
    problems.push(`cycleStart ${effectiveStart} + cycleLength ${effectiveLength} runs past ${steps.length} steps`);
  }
  problems.push(...validateStarsParam(params, { required: true }));
  return problems;
}