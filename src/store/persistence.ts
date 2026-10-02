import { CURRENT_STATE_VERSION, migrate } from './migrations';
import { createInitialState, type GameState, type StoragePort } from './state';

export type { StoragePort } from './state';
export { CURRENT_STATE_VERSION } from './migrations';

const STORAGE_KEY = 'satyrn-book-as-game:v1';

export class ImportError extends Error {}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Structural guard for a complete save; anything less is treated as corrupt. */
export function isGameState(value: unknown): value is GameState {
  if (!isPlainObject(value)) return false;
  return (
    typeof value.version === 'number' &&
    (value.mode === 'thread' || value.mode === 'wander') &&
    isStringArray(value.visitedWorlds) &&
    isStringArray(value.skippedWorlds) &&
    isStringArray(value.completedMechanics) &&
    isStringArray(value.completedEngineRooms) &&
    isPlainObject(value.progress) &&
    isPlainObject(value.evidence) &&
    isStringArray(value.achievements) &&
    isPlainObject(value.settings)
  );
}

/** Read and migrate a save. Never throws: a bad save yields the initial state. */
export function loadState(storage: StoragePort): GameState {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const state = migrate(JSON.parse(raw));
    return isGameState(state) ? state : createInitialState();
  } catch {
    return createInitialState();
  }
}

export function saveState(storage: StoragePort, state: GameState): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportState(state: GameState): string {
  return JSON.stringify(state, null, 2);
}

export function importState(json: string): GameState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new ImportError('import failed: not valid JSON');
  }
  const state = migrate(parsed);
  if (!isGameState(state)) throw new ImportError('import failed: not a valid save');
  return state;
}