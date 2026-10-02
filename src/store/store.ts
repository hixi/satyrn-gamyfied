import type { Achievement } from '../../tools/content/schema';
import { applyEvent, createInitialState, type GameState, type StoragePort, type StoreEvent } from './state';

export type Predicate = (state: GameState, event: StoreEvent) => boolean;
export type EvaluateFn = (state: GameState, event: StoreEvent) => string[];

export interface StoreOptions {
  /** `null` disables persistence (tests). Omitted uses `window.localStorage`. */
  storage?: StoragePort | null;
  /** Achievement catalog; default none. */
  achievements?: Achievement[];
  /** Exotic condition predicates, registered in code. */
  predicates?: Record<string, Predicate>;
  /** Override the achievement evaluator. Default returns no achievements. */
  evaluate?: EvaluateFn;
}

const STORAGE_KEY = 'satyrn-book-as-game:v1';

function defaultStorage(): StoragePort | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** Holds game state, evaluates achievements on each event, and notifies subscribers. */
export class Store {
  private state: GameState;
  private readonly listeners = new Set<(state: GameState, event: StoreEvent) => void>();
  private readonly storage: StoragePort | null;
  private readonly achievements: Achievement[];
  private readonly predicates: Record<string, Predicate>;
  private readonly evaluateFn: EvaluateFn;

  constructor(options: StoreOptions = {}) {
    this.storage = options.storage === undefined ? defaultStorage() : options.storage;
    this.achievements = options.achievements ?? [];
    this.predicates = options.predicates ?? {};
    this.evaluateFn = options.evaluate ?? (() => []);
    this.state = createInitialState();
  }

  getState(): Readonly<GameState> {
    return this.state;
  }

  subscribe(fn: (state: GameState, event: StoreEvent) => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  dispatch(event: StoreEvent): void {
    this.state = applyEvent(this.state, event);
    const earned = this.evaluateFn(this.state, event).filter((id) => !this.state.achievements.includes(id));
    if (earned.length) {
      this.state = { ...this.state, achievements: [...this.state.achievements, ...earned] };
    }
    this.persist();
    for (const listener of this.listeners) listener(this.state, event);
  }

  reset(): void {
    this.state = createInitialState();
    this.persist();
  }

  export(): string {
    return JSON.stringify(this.state, null, 2);
  }

  import(json: string): void {
    this.state = JSON.parse(json) as GameState;
    this.persist();
  }

  private persist(): void {
    if (this.storage) this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }
}