import { createInitialState, type GameState } from './state';

export const CURRENT_STATE_VERSION = 1;

type Migration = (state: Record<string, unknown>) => Record<string, unknown>;

/** Keyed by the version being migrated FROM. Empty until the schema changes. */
const MIGRATIONS: Record<number, Migration> = {};

/**
 * Bring a persisted value up to the current version. Anything unreadable,
 * the wrong shape, or from a version we do not know returns a fresh state —
 * a save is never allowed to crash the game.
 */
export function migrate(raw: unknown): GameState {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return createInitialState();
  let state = raw as Record<string, unknown>;
  const version = state.version;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1 || version > CURRENT_STATE_VERSION) {
    return createInitialState();
  }
  for (let v = version; v < CURRENT_STATE_VERSION; v++) {
    const migration = MIGRATIONS[v];
    if (migration) state = migration(state);
  }
  return state as unknown as GameState;
}