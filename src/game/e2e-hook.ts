import Phaser from 'phaser';

/**
 * Deterministic e2e support. Installed only when the page URL carries
 * `?e2e=1`; the hook never exists without the flag.
 */
export interface E2eHook {
  version: 2;
  seed(n: number): void;
  animationsSkipped(): boolean;
  /** Test introspection: active scene keys, current live-region text, hash. */
  scenes(): string[];
  live(): string | null;
  hash(): string;
  /** Attach a keydown log for keyboard-plumbing probes. */
  watchKeys(tag: string): void;
  heardKeys(): string[];
}

export function installE2eHook(game: Phaser.Game): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  if (!params.has('e2e')) return;
  let seeded: number | null = null;
  const heard: string[] = [];
  // Make the game object reachable for keyboard-plumbing probes.
  (window as unknown as { game?: Phaser.Game }).game = game;
  const hook: E2eHook = {
    version: 2,
    seed(n: number) {
      seeded = n;
      Phaser.Math.RandomDataGenerator;
      for (const scene of game.scene.getScenes(true)) {
        scene.registry.set('e2eSeed', n);
      }
    },
    animationsSkipped() {
      return seeded !== null;
    },
    scenes() {
      return game.scene.getScenes(true).map((scene) => scene.scene.key);
    },
    live() {
      return document.getElementById('satyrn-live')?.textContent ?? null;
    },
    hash() {
      return window.location.hash;
    },
    watchKeys(tag: string) {
      for (const scene of game.scene.getScenes(false)) {
        scene.input.keyboard?.on('keydown', () => {
          heard.push(`${tag}:${scene.scene.key}`);
        });
        scene.input.keyboard?.on('keydown-TAB', () => {
          heard.push(`${tag}:TAB:${scene.scene.key}`);
        });
        const kb = scene.input.keyboard as unknown as {
          _events?: Record<string, unknown>;
        };
        heard.push(`${tag}:names:${scene.scene.key}:${Object.keys(kb._events ?? {}).join(',')}`);
      }
    },
    heardKeys() {
      return [...heard];
    },
  };
  (window as unknown as { __satyrn?: E2eHook }).__satyrn = hook;
}
