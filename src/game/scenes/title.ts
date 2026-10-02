import Phaser from 'phaser';
import { THEME } from '../theme';
import { announce } from '../announce';
import { content } from '../../generated/content';
import type { Store } from '../../store/store';
import { SCENE_KEYS } from '../scene-keys';
import { navigate } from '../router-bridge';
import { makeButton, clearSceneWidgets, resetFocusWiring, useFocus, hudHeight } from '../ui/widgets';

function storeOf(scene: Phaser.Scene): Store {
  return scene.registry.get('store') as Store;
}

const SCREENS = [
  {
    heading: 'The Thread',
    body: 'You are the Wayfarer, walking a thread between ten small handmade worlds. Each world holds a small system built by its keeper — and you learn how it works by working with it.',
  },
  {
    heading: 'Your companions',
    body: 'The Satyrn walks with you: quick, curious, easily distracted. The Moon remembers the journey and asks how you could know something is true. Ten keepers tend the worlds ahead.',
  },
  {
    heading: 'How to play',
    body: 'Move or tap to act. Tab then Enter reaches every button. Esc steps back. Sound is off until you ask. Nothing here can trap you: every Bead can be skipped.',
  },
] as const;

/**
 * Three ungated prologue screens. Skip (screens 1-2) and Step onto the
 * Thread (screen 3) both record `prologue.seen` and land on the map.
 */
export class TitleScene extends Phaser.Scene {
  private screen = 0;

  constructor() {
    super(SCENE_KEYS.title);
  }

  create(): void {
    this.screen = 0;
    resetFocusWiring(this);
    useFocus(this);
    this.render();
    this.input.keyboard?.on('keydown-ESC', () => this.skip());
  }

  private render(): void {
    // Fresh registry per screen. Destroy the old buttons FIRST so their
    // destroy handlers run against the old registry, then reset + rebuild.
    this.children.removeAll(true);
    resetFocusWiring(this);
    useFocus(this);
    clearSceneWidgets(this);
    const { width, height } = this.scale;
    const spec = SCREENS[this.screen];
    const cx = width / 2;
    const top = hudHeight(this) + 24;

    this.add
      .text(cx, top + 20, spec.heading, {
        fontFamily: THEME.fonts.display,
        fontSize: '28px',
        color: THEME.palette.ink,
        align: 'center',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, top + 110, spec.body, {
        fontFamily: THEME.fonts.body,
        fontSize: '16px',
        color: THEME.palette.ink,
        align: 'center',
        wordWrap: { width: Math.min(width - 64, 560) },
      })
      .setOrigin(0.5, 0);

    const y = height - 120;
    if (this.screen < SCREENS.length - 1) {
      // Next first: Enter without Tabbing walks the prologue forward, and
      // the first Tab stop is the primary action on every screen.
      const next = makeButton(this, { id: 'title-next', text: 'Next', onTap: () => this.next() });
      next.setPosition(cx - 110, y);
      const skip = makeButton(this, { id: 'title-skip', text: 'Skip', onTap: () => this.skip() });
      skip.setPosition(cx + 110, y);
    } else {
      const step = makeButton(this, {
        id: 'title-step',
        text: 'Step onto the Thread',
        onTap: () => this.finish(),
      });
      step.setPosition(cx, y);
    }
    announce(`${spec.heading}. ${spec.body}`);
  }

  private next(): void {
    this.screen = Math.min(this.screen + 1, SCREENS.length - 1);
    this.render();
  }

  private skip(): void {
    this.finish();
  }

  private finish(): void {
    // Dispatch while still on Title: the map does not exist yet, so no
    // subscriber can re-render and announce over the arrival line.
    this.registry.set('seenPrologue', true);
    storeOf(this).dispatch({ type: 'prologue.seen' });
    // navigate() only sets the hash: assigning the same hash the page
    // already has fires no event, so a same-hash finish starts the map.
    if (window.location.hash === '#/' || window.location.hash === '') {
      this.scene.start(SCENE_KEYS.map);
    } else {
      navigate('#/');
    }
  }

  /** Screen index for tests: 0 premise, 1 companions, 2 how-to-play. */
  currentScreen(): number {
    return this.screen;
  }
}

export function titleCopy(): { premiseIncludes: string } {
  return { premiseIncludes: content.strings['strings.ui']?.values.appTitle ?? 'Satyrn' };
}
