import Phaser from 'phaser';
import { content } from './generated/content';
import { Store } from './store/store';
import { SoundBank } from './game/audio';
import { announce } from './game/announce';
import { BootScene, SCENE_KEYS } from './game/scenes/boot';
import { installE2eHook } from './game/e2e-hook';

/** Scene stubs until Tasks 6–10 fill them in. Each announces its arrival. */
function stub(key: string, line: string): new () => Phaser.Scene {
  return class extends Phaser.Scene {
    constructor() {
      super(key);
    }
    create(): void {
      announce(line);
    }
  };
}

const store = new Store({ achievements: Object.values(content.achievements) });
const sounds = new SoundBank();
sounds.setEnabled(store.getState().settings.soundOn);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
  render: { pixelArt: false, roundPixels: false },
  fps: { target: 60 },
  scene: [
    BootScene,
    stub(SCENE_KEYS.title, 'You are the Wayfarer, walking a thread between ten small handmade worlds.'),
    stub(SCENE_KEYS.map, 'The Thread.'),
    stub(SCENE_KEYS.world, 'A Bead on the Thread.'),
  ],
};

const game = new Phaser.Game(config);
game.registry.set('store', store);
game.registry.set('sounds', sounds);
game.registry.set('seenPrologue', store.getState().seenPrologue);
game.registry.set('soundOn', store.getState().settings.soundOn);
game.registry.set('reducedMotion', store.getState().settings.reducedMotion);
installE2eHook(game);

if (typeof window !== 'undefined') {
  window.devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
}
