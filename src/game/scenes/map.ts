import Phaser from 'phaser';
import { THEME } from '../theme';
import { announce } from '../announce';
import { content } from '../../generated/content';
import type { Store } from '../../store/store';
import { SCENE_KEYS } from '../scene-keys';
import { navigate } from '../router-bridge';
import { nextUnvisited, threadSequence } from '../../thread';
import { clampScroll, getLayoutMode } from '../layout';
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
 * layout (beads grouped by act). Beads live in a scrollable container so a
 * compact trail never overflows or overlaps; wheel and drag move it.
 */
export class MapScene extends Phaser.Scene {
  private unsubscribe: (() => void) | null = null;
  private arrivalAnnounced = false;
  private lastMode: 'thread' | 'wander' | null = null;
  private scroll = 0;
  private trail: Phaser.GameObjects.Container | null = null;
  private trailHeight = 0;
  private dragStart: number | null = null;

  constructor() {
    super(SCENE_KEYS.map);
  }

  create(): void {
    // The keyboard plugin is torn down on every scene stop/start; render()
    // resets + rewires (store updates re-render in place).
    this.arrivalAnnounced = false;
    this.lastMode = null;
    this.scroll = 0;
    this.cameras.main.setBackgroundColor(THEME.palette.paper);
    this.render();
    this.scale.on('resize', this.render, this);
    // Scroll the trail: wheel moves the view, drag does the same on touch.
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      this.scroll += dy;
      this.applyScroll();
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.dragStart = p.y;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.dragStart === null || !p.isDown) return;
      this.scroll += this.dragStart - p.y;
      this.dragStart = p.y;
      this.applyScroll();
    });
    this.input.on('pointerup', () => {
      this.dragStart = null;
    });
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
    this.trail = null;
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
    const contentH =
      mode === 'thread'
        ? this.renderThread(sequence, state.visitedWorlds, cx, top + 72)
        : this.renderWander(sequence, cx, top + 72);
    this.trailHeight = contentH;
    this.applyScroll();

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

  /** Viewport for the trail: from below the heading to the bottom bar. */
  private trailView(): { top: number; height: number } {
    const { width, height } = this.scale;
    const top = hudHeight(this) + 72;
    return { top, height: Math.max(120, height - top - 110) };
  }

  private applyScroll(): void {
    const view = this.trailView();
    this.scroll = clampScroll(this.scroll, this.trailHeight, view.height);
    this.trail?.setPosition(this.trail.x, view.top - this.scroll);
  }

  /** Lay out the Thread mode trail; returns its content height. */
  private renderThread(sequence: string[], visited: string[], cx: number, startY: number): number {
    const size = 70;
    const next = nextUnvisited(sequence, visited);
    // Continue comes first: it is the primary action and the first Tab stop.
    const order = next ? ['map-continue', ...sequence] : [...sequence];
    this.trail = this.add.container(0, startY);
    order.forEach((id, i) => {
      const y = i * size;
      if (id === 'map-continue' && next) {
        const cont = makeButton(this, {
          id: 'map-continue',
          text: 'Continue the Thread',
          onTap: () => navigate(`#/world/${next}`),
        });
        cont.setPosition(cx, y);
        this.trail!.add(cont);
        return;
      }
      const world = content.worlds[id];
      if (!world) return;
      const solved = (storeOf(this).getState().stars[id] ?? 0) > 0;
      const label = `${id === next ? '➤ ' : ''}${world.title}${solved ? ' ★' : ''}`;
      const bead = makeButton(this, {
        id: `bead-${id}`,
        text: label,
        onTap: () => navigate(`#/world/${id}`),
      });
      bead.setPosition(cx, y);
      this.trail!.add(bead);
    });
    if (!next) {
      this.add
        .text(cx, this.scale.height - 80, 'You have walked the whole Thread.', {
          fontFamily: THEME.fonts.body,
          fontSize: '16px',
          color: THEME.palette.ink,
        })
        .setOrigin(0.5);
    }
    return order.length * size;
  }

  /** Lay out the Wander mode trail (groups by act); returns content height. */
  private renderWander(sequence: string[], cx: number, startY: number): number {
    const stepY = 62;
    let y = 0;
    this.trail = this.add.container(0, startY);
    const acts = ['prologue', 'act1', 'act2', 'act3'];
    for (const act of acts) {
      const group = sequence.filter((id) => content.worlds[id]?.act === act);
      if (!group.length) continue;
      const label = this.add
        .text(cx, y + 12, ACT_LABELS[act] ?? act, {
          fontFamily: THEME.fonts.display,
          fontSize: '20px',
          color: THEME.palette.ink,
          align: 'center',
        })
        .setOrigin(0.5);
      this.trail.add(label);
      y += 44;
      for (const id of group) {
        const world = content.worlds[id];
        if (!world) continue;
        const bead = makeButton(this, {
          id: `bead-${id}`,
          text: world.title,
          onTap: () => navigate(`#/world/${id}`),
        });
        bead.setPosition(cx, y);
        this.trail.add(bead);
        y += stepY;
      }
      y += 16;
    }
    return y;
  }

}
