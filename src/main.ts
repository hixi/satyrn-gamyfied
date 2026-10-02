import Phaser from 'phaser';
import { content } from './generated/content';
import { Store } from './store/store';
import { SoundBank } from './game/audio';
import { announce } from './game/announce';
import { BootScene } from './game/scenes/boot';
import { TitleScene } from './game/scenes/title';
import { MapScene } from './game/scenes/map';
import { SCENE_KEYS } from './game/scene-keys';
import { NotFoundScene, WorldPlaceholderScene } from './game/scenes/world-placeholder';
import { HudScene } from './game/overlays/hud';
import { installE2eHook } from './game/e2e-hook';
import { normalizeRoute, routeToSceneKey } from './game/router-bridge';
import { parseHash } from './router';

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
    TitleScene,
    MapScene,
    WorldPlaceholderScene,
    NotFoundScene,
    HudScene,
    stub(SCENE_KEYS.journal, 'The Moon remembers.'),
  ],
};

function routeFromHash(): void {
  const route = normalizeRoute(parseHash(window.location.hash), store.getState().mode);
  const key = routeToSceneKey(route);
  const data = route.name === 'world' ? { worldId: route.worldId } : {};
  game.scene.stop(SCENE_KEYS.title);
  game.scene.stop(SCENE_KEYS.map);
  game.scene.stop(SCENE_KEYS.world);
  game.scene.stop(SCENE_KEYS.notFound);
  game.scene.stop(SCENE_KEYS.journal);
  game.scene.start(key, data);
  // The HUD overlays every route and must survive route changes.
  if (!game.scene.isActive(SCENE_KEYS.hud)) game.scene.run(SCENE_KEYS.hud);
}

const game = new Phaser.Game(config);
game.registry.set('store', store);
game.registry.set('sounds', sounds);
game.registry.set('seenPrologue', store.getState().seenPrologue);
game.registry.set('soundOn', store.getState().settings.soundOn);
game.registry.set('reducedMotion', store.getState().settings.reducedMotion);
installE2eHook(game);

if (typeof window !== 'undefined') {
  window.devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  window.addEventListener('hashchange', routeFromHash);
  // Deep links (e.g. `#/world/x` on a cold load) must route past the boot
  // default: Boot leaves the first frame empty; the URL picks the scene.
  if (window.location.hash && window.location.hash !== '#/') {
    game.events.once(Phaser.Core.Events.READY, () => {
      routeFromHash();
    });
  }
}
