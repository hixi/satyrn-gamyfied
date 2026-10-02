import Phaser from 'phaser';
import { THEME } from '../theme';
import { announce } from '../announce';
import { content } from '../../generated/content';
import type { Store } from '../../store/store';
import { SCENE_KEYS } from '../scene-keys';
import { navigate } from '../router-bridge';
import { nextUnvisited, threadSequence } from '../../thread';
import { getLayoutMode } from '../layout';
import { makeButton, clearSceneWidgets, resetFocusWiring, useFocus, hudHeight } from '../ui/widgets';

function storeOf(scene: Phaser.Scene): Store {
  return scene.registry.get('store') as Store;
}

const ACT_LABELS: Record<string, string> = {
  prologue: 'Prologue',
  act1: 'Act I — The Making',
  act2: 'Act II — The Snags',
  act3: 'Act III — The Method and the Commons',
};

/**
 * Thread layout (stitched path, solved glow, Continue the Thread) and Wander
 * layout (beads grouped by act). Compact screens get a vertical bead trail.
 */
export class MapScene extends Phaser.Scene {
  private unsubscribe: (() => void) | null = null;
  private arrivalAnnounced = false;
  private lastMode: 'thread' | 'wander' | null = null;

  constructor() {
    super(SCENE_KEYS.map);
  }

  create(): void {
    // The keyboard plugin is torn down on every scene stop/start; render()
    // resets + rewires (store updates re-render in place).
    this.arrivalAnnounced = false;
    this.lastMode = null;
    this.render();
    this.scale.on('resize', this.render, this);
    // Skip re-render when the store event cannot change the map: re-render
    // announces again and rebuilds every button mid-keypress.
    this.unsubscribe = storeOf(this).subscribe((_state, event) => {
      if (event?.type === 'world.entered' || event?.type === 'prologue.seen') return;
      this.render();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = null;
      this.scale.off('resize', this.render, this);
    });
    this.input.keyboard?.on('keydown-ESC', () => navigate('#/journal'));
  }

  private render(): void {
    // Destroy old buttons first so their handlers run against the old
    // registry, then reset + rebuild (same discipline as Title).
    this.children.removeAll(true);
    resetFocusWiring(this);
    useFocus(this);
    clearSceneWidgets(this);
    const store = storeOf(this);
    const state = store.getState();
    const mode = state.mode;
    const sequence = threadSequence(content);
    const { width, height } = this.scale;
    const top = hudHeight(this) + 16;
    const cx = width / 2;

    const heading = mode === 'thread' ? 'The Thread' : 'All the Beads';
    this.add
      .text(cx, top + 16, heading, {
        fontFamily: THEME.fonts.display,
        fontSize: '28px',
        color: THEME.palette.ink,
        align: 'center',
      })
      .setOrigin(0.5);

    const compact = getLayoutMode(width, height) === 'compact';
    if (mode === 'thread') this.renderThread(sequence, state.visitedWorlds, compact);
    else this.renderWander(sequence, compact);

    const solved = sequence.filter((id) => (state.stars[id] ?? 0) > 0).length;
    // One arrival announce per scene start: store-driven re-renders must not
    // overwrite a newer line (prologue screens, world arrivals). Mode
    // switches re-render in place and DO announce: the layout changed.
    if (!this.arrivalAnnounced || this.lastMode !== mode) {
      this.arrivalAnnounced = true;
      this.lastMode = mode;
      announce(
        `${heading}. ${sequence.length} beads, ${solved} solved. ` +
          (mode === 'wander'
            ? Object.values(ACT_LABELS).join('. ')
            : sequence.map((id) => content.worlds[id]?.title ?? id).join('. ')),
      );
    }
  }

  private renderThread(sequence: string[], visited: string[], compact: boolean): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const top = hudHeight(this) + 80;
    const stepY = compact ? 64 : 56;
    const next = nextUnvisited(sequence, visited);
    // Continue comes first: it is the primary action and the first Tab stop.
    const order = next ? ['map-continue', ...sequence] : [...sequence];
    void compact;
    let row = 0;
    for (const id of order) {
      const y = Math.min(top + row * stepY, height - 160);
      row += 1;
      if (id === 'map-continue' && next) {
        const cont = makeButton(this, {
          id: 'map-continue',
          text: 'Continue the Thread',
          onTap: () => navigate(`#/world/${next}`),
        });
        cont.setPosition(cx, y);
        continue;
      }
      const world = content.worlds[id];
      if (!world) continue;
      const solved = (storeOf(this).getState().stars[id] ?? 0) > 0;
      const label = `${id === next ? '➤ ' : ''}${world.title}${solved ? ' ★' : ''}`;
      const bead = makeButton(this, {
        id: `bead-${id}`,
        text: label,
        onTap: () => navigate(`#/world/${id}`),
      });
      bead.setPosition(cx, y);
    }
    if (!next) {
      this.add
        .text(cx, height - 80, 'You have walked the whole Thread.', {
          fontFamily: THEME.fonts.body,
          fontSize: '16px',
          color: THEME.palette.ink,
        })
        .setOrigin(0.5);
    }
  }

  private renderWander(sequence: string[], compact: boolean): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    let y = hudHeight(this) + 80;
    const acts = ['prologue', 'act1', 'act2', 'act3'];
    for (const act of acts) {
      const group = sequence.filter((id) => content.worlds[id]?.act === act);
      if (!group.length) continue;
      this.add
        .text(cx, y, ACT_LABELS[act] ?? act, {
          fontFamily: THEME.fonts.display,
          fontSize: '20px',
          color: THEME.palette.ink,
          align: 'center',
        })
        .setOrigin(0.5);
      y += 40;
      for (const id of group) {
        const world = content.worlds[id];
        if (!world) continue;
        const bead = makeButton(this, {
          id: `bead-${id}`,
          text: world.title,
          onTap: () => navigate(`#/world/${id}`),
        });
        bead.setPosition(cx, Math.min(y, height - 120));
        y += compact ? 64 : 56;
      }
      y += 16;
    }
  }
}
