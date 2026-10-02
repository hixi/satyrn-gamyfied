import Phaser from 'phaser';
import { THEME } from '../theme';
import { announce } from '../announce';
import type { SoundBank } from '../audio';
import type { Store } from '../../store/store';
import { SCENE_KEYS } from '../scene-keys';
import { navigate, setReturnTo } from '../router-bridge';
import { makeButton, clearSceneWidgets, resetFocusWiring, useFocus } from '../ui/widgets';

function storeOf(scene: Phaser.Scene): Store {
  return scene.registry.get('store') as Store;
}

function soundsOf(scene: Phaser.Scene): SoundBank | undefined {
  return scene.registry.get('sounds') as SoundBank | undefined;
}

function starTotal(store: Store): number {
  return Object.values(store.getState().stars).reduce((sum, n) => sum + n, 0);
}

function modeNoun(mode: 'thread' | 'wander'): string {
  return mode === 'thread' ? 'Thread' : 'Wander';
}

/**
 * Persistent top bar: mode toggle, star total, bead count, journal, sound.
 * Launched once and never stopped, so the toggle works from inside a world.
 */
export class HudScene extends Phaser.Scene {
  private bar: Phaser.GameObjects.Container | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    super(SCENE_KEYS.hud);
  }

  create(): void {
    // The keyboard plugin is torn down on every scene stop/start; re-wire.
    // render() also resets + rewires (store updates re-render in place).
    this.render();
    this.scale.on('resize', this.render, this);
    const store = storeOf(this);
    // Skip re-render when the store event cannot change the HUD: re-render
    // rebuilds every button and would steal a Tab press landing mid-frame.
    this.unsubscribe = store.subscribe((_state, event) => {
      if (event?.type === 'world.entered') return;
      this.render();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = null;
      this.scale.off('resize', this.render, this);
    });
  }

  private render(): void {
    // Destroy old buttons first (handlers run against the old registry),
    // then reset + rebuild (same discipline as Title/Map).
    this.bar?.destroy(true);
    resetFocusWiring(this);
    useFocus(this);
    clearSceneWidgets(this);
    this.bar = this.add.container(0, 0).setDepth(100).setScrollFactor(0);
    const width = this.scale.width;
    // Compact grows the bar; scenes read the same height via hudHeight().
    this.registry.set('hudHeight', width < THEME.COMPACT_MAX_WIDTH ? THEME.HUD_HEIGHT_COMPACT : THEME.HUD_HEIGHT);
    const store = storeOf(this);
    const state = store.getState();
    const sounds = soundsOf(this);
    const y = THEME.HUD_HEIGHT / 2;

    const announceMode = (mode: 'thread' | 'wander') => {
      // One live-region write per mode change: the mode and the star total.
      announce(`${modeNoun(mode)} mode. ${starTotal(store)} of 27 stars.`);
    };

    const goMode = (mode: 'thread' | 'wander') => {
      const leavingWorld = window.location.hash.startsWith('#/world');
      store.dispatch({ type: 'mode.changed', mode });
      // The map announces on arrival and would overwrite the mode line;
      // announce after navigation so the mode + stars survive in the reader.
      if (leavingWorld) navigate('#/');
      // Wait for the map scene to arrive before announcing: it re-renders
      // on the mode change (same hash), then routeFromHash restarts it.
      this.time.delayedCall(250, () => announceMode(mode));
    };

    // Compact phones (390px) fit Thread/Wander + stars + sound: journal
    // moves to a second row instead of squeezing off-screen.
    const compact = width < THEME.COMPACT_MAX_WIDTH;
    const thread = makeButton(this, {
      id: 'hud-thread',
      text: state.mode === 'thread' ? '● Thread' : 'Thread',
      mode: compact ? 'compact' : 'expansive',
      onTap: () => goMode('thread'),
    });
    thread.setPosition(compact ? 82 : 90, y);
    const wander = makeButton(this, {
      id: 'hud-wander',
      text: state.mode === 'wander' ? '● Wander' : 'Wander',
      mode: compact ? 'compact' : 'expansive',
      onTap: () => goMode('wander'),
    });
    wander.setPosition(compact ? 244 : 270, y);
    this.bar.add([thread, wander]);

    if (!compact) {
      const stars = this.add
        .text(width - 360, y, `★ ${starTotal(store)}`, {
          fontFamily: THEME.fonts.body,
          fontSize: '16px',
          color: THEME.palette.ink,
        })
        .setOrigin(0.5);
      const beads = this.add
        .text(width - 280, y, `${state.visitedWorlds.length} beads`, {
          fontFamily: THEME.fonts.body,
          fontSize: '16px',
          color: THEME.palette.ink,
        })
        .setOrigin(0.5);
      this.bar.add([stars, beads]);
    } else {
      // Second row right: Wander's right edge would collide on 390px.
      const stars = this.add
        .text(width - 40, y + 56, `★ ${starTotal(store)}`, {
          fontFamily: THEME.fonts.body,
          fontSize: '16px',
          color: THEME.palette.ink,
        })
        .setOrigin(1, 0.5);
      this.bar.add([stars]);
    }

    const journal = makeButton(this, {
      id: 'hud-journal',
      text: 'Journal',
      mode: compact ? 'compact' : 'expansive',
      onTap: () => {
        setReturnTo(window.location.hash || '#/');
        navigate('#/journal');
      },
    });
    // Compact: journal drops to a second row so Thread/Wander stay tappable.
    journal.setPosition(compact ? 82 : width - 170, compact ? y + 56 : y);
    const sound = makeButton(this, {
      id: 'hud-sound',
      text: `Sound: ${state.settings.soundOn ? 'on' : 'off'}`,
      mode: compact ? 'compact' : 'expansive',
      onTap: () => {
        const on = !store.getState().settings.soundOn;
        store.dispatch({ type: 'settings.changed', settings: { soundOn: on } });
        sounds?.setEnabled(on);
        if (on) sounds?.toggleBlip();
        announce(`Sound ${on ? 'on' : 'off'}.`);
      },
    });
    sound.setPosition(compact ? 244 : width - 60, compact ? y + 56 : y);
    this.bar.add([journal, sound]);
  }
}
