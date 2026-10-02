import { duplicates, idsOf, isRecord, type ScenarioProblems } from '../scenario';

export interface Bird {
  id: string;
  name: string;
  traits: string[];
}

export interface Task {
  id: string;
  label: string;
  needs: string[];
}

export const DEFAULT_BIRDS: Bird[] = [
  { id: 'swift', name: 'the swift wren', traits: ['swift', 'small'] },
  { id: 'patient', name: 'the patient heron', traits: ['patient', 'careful'] },
  { id: 'vast', name: 'the vast crane', traits: ['vast', 'careful'] },
];
export const DEFAULT_TASKS: Task[] = [
  { id: 'many', label: 'carry many small messages quickly', needs: ['swift', 'small'] },
  { id: 'gentle', label: 'tend a fragile nest for hours', needs: ['patient', 'careful'] },
  { id: 'wide', label: 'survey the whole valley at once', needs: ['vast', 'careful'] },
];

export function parseScenario(params: unknown): { birds: Bird[]; tasks: Task[] } {
  const raw = (params ?? {}) as { birds?: unknown; tasks?: unknown };
  const parseList = <T,>(value: unknown, fallback: T[], map: (item: Record<string, unknown>, i: number) => T): T[] => {
    if (!Array.isArray(value)) return fallback;
    const mapped = value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object').map(map);
    return mapped.length ? mapped : fallback;
  };
  const birds = parseList<Bird>(raw.birds, DEFAULT_BIRDS, (b, i) => ({
    id: typeof b.id === 'string' && b.id ? b.id : `bird-${i}`,
    name: typeof b.name === 'string' && b.name ? b.name : `bird ${i + 1}`,
    traits: Array.isArray(b.traits) ? b.traits.filter((t): t is string => typeof t === 'string') : [],
  }));
  const tasks = parseList<Task>(raw.tasks, DEFAULT_TASKS, (t, i) => ({
    id: typeof t.id === 'string' && t.id ? t.id : `task-${i}`,
    label: typeof t.label === 'string' && t.label ? t.label : `task ${i + 1}`,
    needs: Array.isArray(t.needs) ? t.needs.filter((n): n is string => typeof n === 'string') : [],
  }));
  return { birds, tasks };
}

/** A full assignment of one distinct bird per task, or an empty map if none exists. */
export function uniqueMatchingTask(birds: Bird[], tasks: Task[]): Map<string, string> {
  const solved = new Map<string, string>();
  const used = new Set<string>();
  const tryAssign = (index: number): boolean => {
    if (index === tasks.length) return true;
    const task = tasks[index];
    for (const bird of birds) {
      if (used.has(bird.id)) continue;
      if (!task.needs.every((need) => bird.traits.includes(need))) continue;
      used.add(bird.id);
      solved.set(task.id, bird.id);
      if (tryAssign(index + 1)) return true;
      used.delete(bird.id);
      solved.delete(task.id);
    }
    return false;
  };
  return tryAssign(0) ? solved : new Map();
}

export function validateScenario(params: unknown): ScenarioProblems {
  const problems: ScenarioProblems = [];
  if (params !== undefined && params !== null && !isRecord(params)) {
    return ['params must be a mapping'];
  }
  const raw = isRecord(params) ? params : {};
  if (raw.birds !== undefined && !Array.isArray(raw.birds)) problems.push('birds must be a list');
  if (raw.tasks !== undefined && !Array.isArray(raw.tasks)) problems.push('tasks must be a list');

  const { birds, tasks } = parseScenario(params);
  for (const id of duplicates(idsOf(birds))) problems.push(`duplicate bird id: ${id}`);
  for (const id of duplicates(idsOf(tasks))) problems.push(`duplicate task id: ${id}`);

  const matching = uniqueMatchingTask(birds, tasks);
  if (matching.size !== tasks.length) {
    problems.push('unsolvable: no way to lend each errand a suited bird, each bird once');
  }
  return problems;
}