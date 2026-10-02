import Phaser from 'phaser';
import { THEME } from '../theme';
import { announce } from '../announce';
import type { Store } from '../../store/store';
import { SCENE_KEYS } from '../scene-keys';
import { makeButton, clearSceneWidgets, resetFocusWiring, useFocus } from '../ui/widgets';

function storeOf(scene: Phaser.Scene): Store {
  return scene.registry.get('store') as Store;
}

/** Moon narration per act, one line each. Shown once per act in Thread mode. */
export const ACT_COPY: Record<string, string> = {
  prologue: 'The Moon lights the first bead. Begin where the dark is deepest.',
  act1: 'The Moon watches you make things. Three small systems, three small lessons.',
  act2: 'The Moon narrows her eyes. Here is where threads snag — walk carefully.',
  act3: 'The Moon smiles. Now make something of your own, and share the pipe.',
};

/**
 * Full-screen Moon narration card. Continue records `actCard.seen` for the
 * act so it shows once; the caller decides when an act begins.
 */
export class ActCardScene extends Phaser.Scene {
  private act = 'prologue';

  constructor() {
    super(SCENE_KEYS.actCard);
  }

  /** Show the card for an act. */
  open(act: string): void {
    this.act = act;
    if (!this.scene.isActive()) this.scene.run(SCENE_KEYS.actCard);
    else this.render();
  }

  create(): void {
    this.render();
  }

  private render(): void {
    this.children.removeAll(true);
    resetFocusWiring(this);
    useFocus(this);
    clearSceneWidgets(this);
    const { width, height } = this.scale;
    const cx = width / 2;
    this.add
      .text(cx, height / 2 - 60, 'The Moon says', {
        fontFamily: THEME.fonts.display,
        fontSize: '20px',
        color: THEME.palette.ink,
      })
      .setOrigin(0.5);
    this.add
      .text(cx, height / 2, ACT_COPY[this.act] ?? ACT_COPY.prologue, {
        fontFamily: THEME.fonts.body,
        fontSize: '16px',
        color: THEME.palette.ink,
        align: 'center',
        wordWrap: { width: Math.min(width - 64, 560) },
      })
      .setOrigin(0.5);
    const cont = makeButton(this, {
      id: 'actcard-continue',
      text: 'Continue',
      onTap: () => {
        storeOf(this).dispatch({ type: 'actCard.seen', act: this.act });
        announce('Onward.');
        this.scene.stop(SCENE_KEYS.actCard);
      },
    });
    cont.setPosition(cx, height / 2 + 110);
    announce(`The Moon says. ${ACT_COPY[this.act] ?? ''}`);
  }
}
