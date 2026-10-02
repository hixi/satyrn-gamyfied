import Phaser from 'phaser';
import { THEME } from '../theme';
import { announce } from '../announce';
import { content } from '../../generated/content';
import type { Store } from '../../store/store';
import { navigate } from '../router-bridge';
import { makeButton, clearSceneWidgets, resetFocusWiring, useFocus } from '../ui/widgets';

/**
 * Minimal tappable card used by the placeholder and not-found scenes until the
 * Task 7 widget factory lands (Task 7 refactors these onto shared widgets).
 */
export function drawCard(
  scene: Phaser.Scene,
  title: string,
  body: string,
  buttonLabel: string,
  onTap: () => void,
): void {
  const { width, height } = scene.scale;
  const cx = width / 2;
  const cy = height / 2;
  const panelW = Math.min(width - 48, 560);
  const panelH = Math.min(height - 120, 360);

  scene.add
    .rectangle(cx, cy, panelW, panelH, Phaser.Display.Color.HexStringToColor(THEME.palette.paper).color)
    .setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(THEME.palette.charcoal).color);

  scene.add
    .text(cx, cy - panelH / 2 + 56, title, {
      fontFamily: THEME.fonts.display,
      fontSize: '28px',
      color: THEME.palette.ink,
      align: 'center',
      wordWrap: { width: panelW - 64 },
    })
    .setOrigin(0.5);

  scene.add
    .text(cx, cy - 10, body, {
      fontFamily: THEME.fonts.body,
      fontSize: '16px',
      color: THEME.palette.ink,
      align: 'center',
      wordWrap: { width: panelW - 64 },
    })
    .setOrigin(0.5);

  const button = scene.add
    .rectangle(cx, cy + panelH / 2 - 56, 280, THEME.MIN_TOUCH, Phaser.Display.Color.HexStringToColor(THEME.palette.yellow).color)
    .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(THEME.palette.charcoal).color)
    .setInteractive({ useHandCursor: true });
  scene.add
    .text(cx, cy + panelH / 2 - 56, buttonLabel, {
      fontFamily: THEME.fonts.body,
      fontSize: '16px',
      color: THEME.palette.ink,
    })
    .setOrigin(0.5);
  button.on('pointerup', onTap);
}

/** Stand-in world scene: proves routing + store events until Wave 1 builds the real rooms. */
export class WorldPlaceholderScene extends Phaser.Scene {
  constructor() {
    super('world');
  }

  create(data: { worldId?: string }): void {
    const world = data.worldId ? content.worlds[data.worldId] : undefined;
    const title = world?.title ?? 'Unknown Bead';
    const store = this.registry.get('store') as Store | undefined;
    if (world) store?.dispatch({ type: 'world.entered', world: world.id });
    // Shared widget discipline: destroy first, then reset + rebuild.
    this.children.removeAll(true);
    resetFocusWiring(this);
    useFocus(this);
    clearSceneWidgets(this);
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
    const back = makeButton(this, { id: 'world-back', text: 'Back to the map', onTap: () => navigate('#/') });
    back.setPosition(cx, cy + 70);
    announce(`${title}. This Bead opens in its wave.`);
  }
}

/** Unknown routes land here with a way home. */
export class NotFoundScene extends Phaser.Scene {
  constructor() {
    super('not-found');
  }

  create(): void {
    announce('That path is not on the Thread. Back to the map.');
    drawCard(this, 'Not on the Thread', 'That path leads nowhere — yet.', 'Back to the map', () => navigate('#/'));
  }
}
