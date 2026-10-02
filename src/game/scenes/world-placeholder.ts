import Phaser from 'phaser';
import { THEME } from '../theme';
import { announce } from '../announce';
import { content } from '../../generated/content';
import type { Store } from '../../store/store';
import { navigate } from '../router-bridge';
import { toast } from '../overlays/toasts';
import { makeButton, clearSceneWidgets, resetFocusWiring, useFocus } from '../ui/widgets';

/** Stand-in world scene: proves routing + store events until Wave 1 builds the real rooms. */
export class WorldPlaceholderScene extends Phaser.Scene {
  constructor() {
    super('world');
  }

  create(data: { worldId?: string }): void {
    const world = data.worldId ? content.worlds[data.worldId] : undefined;
    const worldId = world?.id ?? data.worldId ?? 'world.unknown';
    const title = world?.title ?? 'Unknown Bead';
    const store = this.registry.get('store') as Store | undefined;
    if (world) store?.dispatch({ type: 'world.entered', world: world.id });
    // Fresh scene start: no old buttons exist, so reset + rebuild directly.
    // (removeAll would run first with nothing to clear; create() runs once.)
    resetFocusWiring(this);
    useFocus(this);
    clearSceneWidgets(this);
    this.cameras.main.setBackgroundColor(THEME.palette.paper);
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;
    this.add
      .text(cx, cy - 80, title, {
        fontFamily: THEME.fonts.display,
        fontSize: '28px',
        color: THEME.palette.ink,
        align: 'center',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, cy - 10, 'This Bead opens in its wave.', {
        fontFamily: THEME.fonts.body,
        fontSize: '16px',
        color: THEME.palette.ink,
        align: 'center',
      })
      .setOrigin(0.5);
    // Skip first: Enter without Tabbing takes the honest out, and the first
    // Tab stop is the primary action (matches Title/Map Continue-first).
    const skip = makeButton(this, {
      id: 'world-skip',
      text: 'Continue without playing',
      onTap: () => {
        store?.dispatch({ type: 'world.skipped', world: worldId });
        announce('Skipped — honestly. Come back later if you like; the Thread keeps your place.');
        toast(this.game, 'Skipped — come back later.');
      },
    });
    skip.setPosition(cx, cy + 70);
    const back = makeButton(this, { id: 'world-back', text: 'Back to the map', onTap: () => navigate('#/') });
    back.setPosition(cx, cy + 130);
    // Esc backs out of a world to the map (keyboard-only play).
    this.input.keyboard?.on('keydown-ESC', () => navigate('#/'));
    announce(`${title}. This Bead opens in its wave.`);
  }
}

/** Unknown routes land here with a way home. */
export class NotFoundScene extends Phaser.Scene {
  constructor() {
    super('not-found');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(THEME.palette.paper);
    resetFocusWiring(this);
    useFocus(this);
    clearSceneWidgets(this);
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;
    this.add
      .text(cx, cy - 60, 'Not on the Thread', {
        fontFamily: THEME.fonts.display,
        fontSize: '28px',
        color: THEME.palette.ink,
        align: 'center',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, cy, 'That path leads nowhere — yet.', {
        fontFamily: THEME.fonts.body,
        fontSize: '16px',
        color: THEME.palette.ink,
        align: 'center',
      })
      .setOrigin(0.5);
    const back = makeButton(this, { id: 'notfound-back', text: 'Back to the map', onTap: () => navigate('#/') });
    back.setPosition(cx, cy + 70);
    announce('That path is not on the Thread. Back to the map.');
  }
}
