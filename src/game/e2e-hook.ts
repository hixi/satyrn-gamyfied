import Phaser from 'phaser';

/**
 * Deterministic e2e support. Installed only when the page URL carries
 * `?e2e=1`; the hook never exists without the flag.
 */
export interface E2eHook {
  version: 2;
  seed(n: number): void;
  animationsSkipped(): boolean;
}

export function installE2eHook(game: Phaser.Game): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  if (!params.has('e2e')) return;
  let seeded: number | null = null;
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
  };
  (window as unknown as { __satyrn?: E2eHook }).__satyrn = hook;
}
