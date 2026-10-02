import Phaser from 'phaser';
import { THEME } from '../theme';
import { announce } from '../announce';
import type { SoundBank } from '../audio';
import type { Store } from '../../store/store';
import { SCENE_KEYS } from '../scene-keys';
import { getReturnTo, navigate, setReturnTo } from '../router-bridge';
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

    const thread = makeButton(this, {
      id: 'hud-thread',
      text: state.mode === 'thread' ? '● Thread' : 'Thread',
      onTap: () => goMode('thread'),
    });
    thread.setPosition(90, y);
    const wander = makeButton(this, {
      id: 'hud-wander',
      text: state.mode === 'wander' ? '● Wander' : 'Wander',
      onTap: () => goMode('wander'),
    });
    wander.setPosition(270, y);
    this.bar.add([thread, wander]);

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

    const journal = makeButton(this, {
      id: 'hud-journal',
      text: 'Journal',
      onTap: () => {
        setReturnTo(window.location.hash || '#/');
        navigate('#/journal');
      },
    });
    journal.setPosition(width - 170, y);
    const sound = makeButton(this, {
      id: 'hud-sound',
      text: `Sound: ${state.settings.soundOn ? 'on' : 'off'}`,
      onTap: () => {
        const on = !store.getState().settings.soundOn;
        store.dispatch({ type: 'settings.changed', settings: { soundOn: on } });
        sounds?.setEnabled(on);
        if (on) sounds?.toggleBlip();
        announce(`Sound ${on ? 'on' : 'off'}.`);
      },
    });
    sound.setPosition(width - 60, y);
    this.bar.add([journal, sound]);
    void getReturnTo;
  }
}
