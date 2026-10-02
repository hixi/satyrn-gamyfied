import Phaser from 'phaser';
import { THEME } from '../theme';
import { announce } from '../announce';

/**
 * Non-blocking toast queue: at most 3 visible, 2.5s each, never steals
 * input. Every toast is also announced to the live region.
 */
export class ToastsScene extends Phaser.Scene {
  private queue: string[] = [];
  private showing = false;
  private label: Phaser.GameObjects.Text | null = null;

  constructor() {
    super('toasts');
  }

  create(): void {
    this.label = this.add
      .text(this.scale.width / 2, this.scale.height - 48, '', {
        fontFamily: THEME.fonts.body,
        fontSize: '14px',
        color: THEME.palette.paper,
        backgroundColor: THEME.palette.charcoal,
        padding: { x: 12, y: 8 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(200)
      .setScrollFactor(0);
  }

  /** Queue a toast; drops the oldest past 3 waiting. */
  toast(text: string): void {
    if (this.queue.length >= 3) this.queue.shift();
    this.queue.push(text);
    announce(text);
    if (!this.showing) this.next();
  }

  private next(): void {
    const text = this.queue.shift();
    if (!text || !this.label) {
      this.showing = false;
      return;
    }
    this.showing = true;
    this.label.setText(text).setVisible(true);
    this.time.delayedCall(2500, () => {
      this.label?.setVisible(false);
      this.next();
    });
  }
}

/** Send a toast via the scene manager when the overlay is running. */
export function toast(game: Phaser.Game, text: string): void {
  if (!game.scene.isActive('toasts')) return;
  const scene = game.scene.getScene('toasts') as ToastsScene;
  scene.toast(text);
}
