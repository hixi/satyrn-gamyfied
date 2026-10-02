import Phaser from 'phaser';
import { THEME } from '../theme';
import { SCENE_KEYS } from '../scene-keys';

function flatTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

/** Shared generated textures: one flat in-code art style, no assets. */
function generateTextures(scene: Phaser.Scene): void {
  flatTexture(scene, 'dot', 16, 16, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
  });
  flatTexture(scene, 'bead', 48, 48, (g) => {
    g.fillStyle(0xe3d678, 1);
    g.fillCircle(24, 24, 22);
    g.lineStyle(4, 0x433715, 1);
    g.strokeCircle(24, 24, 22);
  });
  flatTexture(scene, 'bead-dim', 48, 48, (g) => {
    g.fillStyle(0xefe4d2, 1);
    g.fillCircle(24, 24, 22);
    g.lineStyle(4, 0x383330, 1);
    g.strokeCircle(24, 24, 22);
  });
  for (const [key, robe, face] of [
    ['satyrn', 0x433715, 0xe3d678],
    ['moon', 0xefe4d2, 0xfbf7ef],
    ['keeper', 0x383330, 0xefe4d2],
  ] as const) {
    flatTexture(scene, `portrait-${key}`, 96, 96, (g) => {
      g.fillStyle(robe, 1);
      g.fillRoundedRect(0, 0, 96, 96, 16);
      g.fillStyle(face, 1);
      g.fillCircle(48, 44, 24);
      g.fillStyle(0x2a2622, 1);
      g.fillCircle(40, 40, 4);
      g.fillCircle(56, 40, 4);
    });
  }
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.boot);
  }

  create(): void {
    generateTextures(this);
    this.applySettings();
    // Toasts overlay every route like the HUD; start it once at boot.
    this.scene.run(SCENE_KEYS.toasts);
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    // A deep link wins over the boot default; Boot owns the first frame only.
    const seen = this.registry.get('seenPrologue') === true;
    const first = hash && hash !== '#/' ? null : seen ? SCENE_KEYS.map : SCENE_KEYS.title;
    // The HUD stays alive across every route, so its toggle works in-world.
    this.scene.run(SCENE_KEYS.hud);
    if (first) this.scene.start(first);
  }

  private applySettings(): void {
    const soundOn = this.registry.get('soundOn') === true;
    this.registry.set('soundOn', soundOn);
    const reduced =
      this.registry.get('reducedMotion') === true ||
      (typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.registry.set('reducedMotion', reduced);
    this.cameras.main.setBackgroundColor(THEME.palette.paper);
  }
}
