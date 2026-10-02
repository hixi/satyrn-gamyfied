import Phaser from 'phaser';
import { THEME } from '../theme';
import { announce } from '../announce';
import { content } from '../../generated/content';
import type { Store } from '../../store/store';
import { SCENE_KEYS } from '../scene-keys';
import { matchesCondition } from '../../store/achievements';
import { makeButton, clearSceneWidgets, resetFocusWiring, useFocus } from '../ui/widgets';

function storeOf(scene: Phaser.Scene): Store {
  return scene.registry.get('store') as Store;
}

/** Sentinel event: dialogue gating reads state, never a live event. */
const NO_MATCH_EVENT = { type: 'prologue.seen' } as const;

/**
 * Single-scene dialogue runner: renders the current node from `start`,
 * filters choices by `condition` against store state, announces each line.
 * Instant text (no typewriter debt in Wave 0); Esc closes only when the
 * dialogue is closable (a `close` choice exists).
 */
export class DialogueScene extends Phaser.Scene {
  private dialogueId = '';
  private nodeId = '';

  constructor() {
    super(SCENE_KEYS.dialogue);
  }

  /** Open a dialogue by content id. */
  open(dialogueId: string): void {
    const dialogue = content.dialogues[dialogueId];
    if (!dialogue) return;
    this.dialogueId = dialogueId;
    this.nodeId = dialogue.start;
    if (!this.scene.isActive()) this.scene.run(SCENE_KEYS.dialogue);
    else this.render();
  }

  create(): void {
    this.render();
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.closable()) this.scene.stop(SCENE_KEYS.dialogue);
    });
  }

  private closable(): boolean {
    const node = content.dialogues[this.dialogueId]?.nodes[this.nodeId];
    return node?.choices.some((c) => c.id === 'close') ?? false;
  }

  private render(): void {
    this.children.removeAll(true);
    resetFocusWiring(this);
    useFocus(this);
    clearSceneWidgets(this);
    const dialogue = content.dialogues[this.dialogueId];
    const node = dialogue?.nodes[this.nodeId];
    if (!dialogue || !node) {
      this.scene.stop(SCENE_KEYS.dialogue);
      return;
    }
    const store = storeOf(this);
    const state = store.getState();
    const { width, height } = this.scale;
    const cx = width / 2;
    const panelW = Math.min(width - 48, 560);

    const speaker = content.characters[node.speaker];
    this.add
      .text(cx, height - 260, speaker?.name ?? node.speaker, {
        fontFamily: THEME.fonts.display,
        fontSize: '20px',
        color: THEME.palette.ink,
      })
      .setOrigin(0.5);
    this.add
      .text(cx, height - 210, node.text, {
        fontFamily: THEME.fonts.body,
        fontSize: '16px',
        color: THEME.palette.ink,
        align: 'center',
        wordWrap: { width: panelW - 32 },
      })
      .setOrigin(0.5, 0);
    announce(`${speaker?.name ?? ''}: ${node.text}`);

    const visible = node.choices.filter(
      (c) => !c.condition || matchesCondition(state, NO_MATCH_EVENT, c.condition),
    );
    visible.forEach((choice, i) => {
      const button = makeButton(this, {
        id: `dialogue-choice-${choice.id}`,
        text: choice.text,
        onTap: () => this.choose(choice.id, choice.next),
      });
      button.setPosition(cx, height - 110 + i * 56);
    });
  }

  private choose(_id: string, next?: string): void {
    if (!next) {
      this.scene.stop(SCENE_KEYS.dialogue);
      return;
    }
    this.nodeId = next;
    this.render();
  }
}

/** Open a dialogue from any scene via the game instance. */
export function showDialogue(game: Phaser.Game, dialogueId: string): void {
  const scene = game.scene.getScene(SCENE_KEYS.dialogue) as DialogueScene;
  scene.open(dialogueId);
}
