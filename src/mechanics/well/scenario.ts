import { duplicates, idsOf, isRecord, isPositiveNumber, type ScenarioProblems } from '../scenario';

export type Source = 'well' | 'pipe';

export interface Task {
  id: string;
  label: string;
  need: number;
  sensitive: boolean;
}

const DEFAULT_CAPACITY = 5;
const DEFAULT_TASKS: Task[] = [
  { id: 'drinking', label: 'drinking water', need: 2, sensitive: true },
  { id: 'bathing', label: 'bathing water', need: 2, sensitive: true },
  { id: 'laundry', label: 'laundry', need: 3, sensitive: false },
  { id: 'garden', label: 'watering the garden', need: 5, sensitive: false },
];

export function parseScenario(params: unknown): { wellCapacity: number; tasks: Task[] } {
  const raw = (params ?? {}) as { wellCapacity?: unknown; tasks?: unknown };
  const wellCapacity = isPositiveNumber(raw.wellCapacity) ? raw.wellCapacity : DEFAULT_CAPACITY;
  const tasks = Array.isArray(raw.tasks)
    ? raw.tasks
        .filter((t): t is Record<string, unknown> => !!t && typeof t === 'object')
        .map((t, i) => ({
          id: typeof t.id === 'string' && t.id ? t.id : `task-${i}`,
          label: typeof t.label === 'string' && t.label ? t.label : `need ${i + 1}`,
          need: isPositiveNumber(t.need) ? t.need : 1,
          sensitive: t.sensitive === true,
        }))
    : [];
  return { wellCapacity, tasks: tasks.length ? tasks : DEFAULT_TASKS };
}

export function validateScenario(params: unknown): ScenarioProblems {
  const problems: ScenarioProblems = [];
  if (params !== undefined && params !== null && !isRecord(params)) {
    return ['params must be a mapping'];
  }
  const raw = isRecord(params) ? params : {};
  if (raw.wellCapacity !== undefined && !isPositiveNumber(raw.wellCapacity)) {
    problems.push('wellCapacity must be a positive number');
  }
  if (raw.tasks !== undefined && !Array.isArray(raw.tasks)) problems.push('tasks must be a list');

  const { wellCapacity, tasks } = parseScenario(params);
  for (const id of duplicates(idsOf(tasks))) problems.push(`duplicate task id: ${id}`);

  // Sending every non-sensitive need down the pipe is always allowed, so a
  // routing exists exactly when the sensitive needs fit in the well.
  const sensitiveNeed = tasks.filter((t) => t.sensitive).reduce((sum, t) => sum + t.need, 0);
  if (sensitiveNeed > wellCapacity) {
    problems.push(`unsolvable: sensitive needs (${sensitiveNeed}) exceed the well (${wellCapacity})`);
  }
  return problems;
}