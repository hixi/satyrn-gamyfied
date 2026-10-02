export interface Settings {
  reducedMotion: boolean;
}

export interface GameState {
  version: number;
  mode: 'thread' | 'wander';
  visitedWorlds: string[];
  skippedWorlds: string[];
  completedMechanics: string[];
  completedEngineRooms: string[];
  progress: Record<string, number>;
  evidence: Record<string, unknown>;
  achievements: string[];
  settings: Settings;
}

export type StoreEvent =
  | { type: 'world.entered'; world: string }
  | { type: 'world.skipped'; world: string }
  | { type: 'world.engineRoom.completed'; world: string }
  | { type: 'mechanic.progress'; mechanic: string; value: number }
  | { type: 'mechanic.completed'; mechanic: string; world?: string }
  | { type: 'evidence.submitted'; mechanic: string; evidence: unknown }
  | { type: 'mode.changed'; mode: 'thread' | 'wander' }
  | { type: 'settings.changed'; settings: Partial<Settings> };

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const CURRENT_STATE_VERSION = 1;

export function createInitialState(): GameState {
  return {
    version: CURRENT_STATE_VERSION,
    mode: 'thread',
    visitedWorlds: [],
    skippedWorlds: [],
    completedMechanics: [],
    completedEngineRooms: [],
    progress: {},
    evidence: {},
    achievements: [],
    settings: { reducedMotion: false },
  };
}

function pushUnique(list: string[], value: string): string[] {
  return list.includes(value) ? list : [...list, value];
}

export function applyEvent(state: GameState, event: StoreEvent): GameState {
  switch (event.type) {
    case 'world.entered':
      return { ...state, visitedWorlds: pushUnique(state.visitedWorlds, event.world) };
    case 'world.skipped':
      return { ...state, skippedWorlds: pushUnique(state.skippedWorlds, event.world) };
    case 'world.engineRoom.completed':
      return { ...state, completedEngineRooms: pushUnique(state.completedEngineRooms, event.world) };
    case 'mechanic.progress':
      return { ...state, progress: { ...state.progress, [event.mechanic]: event.value } };
    case 'mechanic.completed':
      return { ...state, completedMechanics: pushUnique(state.completedMechanics, event.mechanic) };
    case 'evidence.submitted':
      return { ...state, evidence: { ...state.evidence, [event.mechanic]: event.evidence } };
    case 'mode.changed':
      return { ...state, mode: event.mode };
    case 'settings.changed':
      return { ...state, settings: { ...state.settings, ...event.settings } };
    default:
      return state;
  }
}