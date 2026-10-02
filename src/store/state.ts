export interface Settings {
  reducedMotion: boolean;
  soundOn: boolean;
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
  stars: Record<string, number>;
  earnedConcepts: string[];
  seenPrologue: boolean;
  seenActCards: string[];
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
  | { type: 'stars.awarded'; world: string; stars: number }
  | { type: 'concept.earned'; concept: string }
  | { type: 'prologue.seen' }
  | { type: 'actCard.seen'; act: string }
  | { type: 'settings.changed'; settings: Partial<Settings> };

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Bump when `GameState` changes shape; add a migration for the old version. */
export const CURRENT_STATE_VERSION = 2;

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
    stars: {},
    earnedConcepts: [],
    seenPrologue: false,
    seenActCards: [],
    settings: { reducedMotion: false, soundOn: false },
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
    case 'stars.awarded': {
      const best = Math.max(state.stars[event.world] ?? 0, event.stars);
      return { ...state, stars: { ...state.stars, [event.world]: best } };
    }
    case 'concept.earned':
      return { ...state, earnedConcepts: pushUnique(state.earnedConcepts, event.concept) };
    case 'prologue.seen':
      return { ...state, seenPrologue: true };
    case 'actCard.seen':
      return { ...state, seenActCards: pushUnique(state.seenActCards, event.act) };
    case 'settings.changed':
      return { ...state, settings: { ...state.settings, ...event.settings } };
    default:
      return state;
  }
}