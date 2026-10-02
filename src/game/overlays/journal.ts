import Phaser from 'phaser';
import { THEME } from '../theme';
import { announce } from '../announce';
import { content } from '../../generated/content';
import type { Store } from '../../store/store';
import { ImportError } from '../../store/persistence';
import { SCENE_KEYS } from '../scene-keys';
import { getReturnTo, navigate } from '../router-bridge';
import { makeButton, makeTabs, clearSceneWidgets, resetFocusWiring, useFocus, hudHeight } from '../ui/widgets';
import { toast } from './toasts';

function storeOf(scene: Phaser.Scene): Store {
  return scene.registry.get('store') as Store;
}

const TABS = ['Journey', 'Cards', 'Honors', 'Keepsake'] as const;
type TabName = (typeof TABS)[number];

/**
 * The Moon's memory: progress + stars, earned concepts, achievements, and
 * export/import/reset. Back returns to `getReturnTo()`.
 */
export class JournalScene extends Phaser.Scene {
  private tab: TabName = 'Journey';
  private unsubscribe: (() => void) | null = null;

  constructor() {
    super(SCENE_KEYS.journal);
  }

  create(): void {
    this.tab = 'Journey';
    this.render();
    this.scale.on('resize', this.render, this);
    this.unsubscribe = storeOf(this).subscribe(() => this.render());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = null;
      this.scale.off('resize', this.render, this);
    });
    this.input.keyboard?.on('keydown-ESC', () => this.back());
  }

  private render(): void {
    this.children.removeAll(true);
    resetFocusWiring(this);
    useFocus(this);
    clearSceneWidgets(this);
    const store = storeOf(this);
    const state = store.getState();
    const { width, height } = this.scale;
    const cx = width / 2;
    const top = hudHeight(this) + 16;

    this.add
      .text(cx, top + 16, "The Moon's Memory", {
        fontFamily: THEME.fonts.display,
        fontSize: '28px',
        color: THEME.palette.ink,
        align: 'center',
      })
      .setOrigin(0.5);

    // Tab taps re-render with the new tab; makeTabs.select never fires
    // onSelect by itself, so no setup loop is possible.
    const tabs = makeTabs(this, [...TABS], 'expansive', {
      prefix: 'journal-tab',
      onSelect: (i) => {
        this.tab = TABS[i] ?? 'Journey';
        this.render();
      },
    });
    // Show the current tab as selected (visual index only, no callback).
    void tabs;
    tabs.container.setPosition(cx - 270, top + 64);

    const bodyTop = top + 130;
    const bodyWidth = Math.min(width - 64, 560);
    if (this.tab === 'Journey') {
      const stars = Object.entries(state.stars);
      const total = stars.reduce((sum, [, n]) => sum + n, 0);
      const lines = [
        `${state.visitedWorlds.length} beads visited, ${total} stars.`,
        ...stars.map(([world, n]) => `${content.worlds[world]?.title ?? world}: ${n} ★`),
      ];
      this.add
        .text(cx, bodyTop, ['Journey', '', ...lines].join('\n'), {
          fontFamily: THEME.fonts.body,
          fontSize: '16px',
          color: THEME.palette.ink,
          align: 'center',
          wordWrap: { width: bodyWidth },
        })
        .setOrigin(0.5, 0);
    } else if (this.tab === 'Cards') {
      const cards =
        state.earnedConcepts.length > 0
          ? state.earnedConcepts.map((id) => content.concepts[id]?.term ?? id)
          : ['No cards yet — solve a Bead to earn one.'];
      this.add
        .text(cx, bodyTop, ['Cards', '', ...cards].join('\n'), {
          fontFamily: THEME.fonts.body,
          fontSize: '16px',
          color: THEME.palette.ink,
          align: 'center',
          wordWrap: { width: bodyWidth },
        })
        .setOrigin(0.5, 0);
    } else if (this.tab === 'Honors') {
      const honors =
        state.achievements.length > 0
          ? state.achievements.map((id) => content.achievements[id]?.title ?? id)
          : ['No honors yet.'];
      this.add
        .text(cx, bodyTop, ['Honors', '', ...honors].join('\n'), {
          fontFamily: THEME.fonts.body,
          fontSize: '16px',
          color: THEME.palette.ink,
          align: 'center',
          wordWrap: { width: bodyWidth },
        })
        .setOrigin(0.5, 0);
    } else {
      this.add
        .text(cx, bodyTop, 'Keepsake\n\nYour progress lives in this browser. Export a copy, or start over.', {
          fontFamily: THEME.fonts.body,
          fontSize: '16px',
          color: THEME.palette.ink,
          align: 'center',
          wordWrap: { width: bodyWidth },
        })
        .setOrigin(0.5, 0);
      const exp = makeButton(this, {
        id: 'journal-export',
        text: 'Export',
        onTap: () => this.exportSave(store),
      });
      exp.setPosition(cx, bodyTop + 150);
      const imp = makeButton(this, {
        id: 'journal-import',
        text: 'Import',
        onTap: () => this.importSave(store),
      });
      imp.setPosition(cx, bodyTop + 214);
      const reset = makeButton(this, {
        id: 'journal-reset',
        text: 'Reset',
        onTap: () => this.resetSave(store),
      });
      reset.setPosition(cx, bodyTop + 278);
    }

    const back = makeButton(this, { id: 'journal-back', text: 'Back', onTap: () => this.back() });
    back.setPosition(cx, height - 80);
    announce(`The Moon remembers. ${this.tab}. Journey. Cards. Honors. Keepsake.`);
  }

  private back(): void {
    navigate(getReturnTo());
  }

  private exportSave(store: Store): void {
    const data = store.export();
    const done = (via: string) => {
      toast(this.game, `Keepsake copied (${via}).`);
      announce('Keepsake copied. Keep it somewhere safe.');
    };
    const fallback = () => {
      // Visible fallback: show the first line so it can be copied by hand.
      announce(`Export code: ${data.slice(0, 80)}…`);
      toast(this.game, 'Copy the export code from the journal.');
    };
    try {
      const clipboard = navigator.clipboard;
      if (!clipboard) {
        fallback();
        return;
      }
      clipboard.writeText(data).then(
        () => done('clipboard'),
        () => fallback(),
      );
    } catch {
      fallback();
    }
  }

  private importSave(store: Store): void {
    // Native file-less import: summon a hidden input, read text, import.
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Paste a keepsake code';
    input.setAttribute('aria-label', 'Paste a keepsake code');
    input.style.cssText = 'position:fixed;top:10px;left:10px;z-index:9999;width:80%;';
    document.body.appendChild(input);
    input.focus();
    input.addEventListener('change', () => {
      try {
        store.import(input.value);
        toast(this.game, 'Keepsake restored.');
      } catch (error) {
        const message = error instanceof ImportError ? error.message : 'Import failed.';
        announce(message);
        toast(this.game, message);
      } finally {
        input.remove();
      }
    });
  }

  private resetSave(store: Store): void {
    if (!window.confirm('Start over? Your beads, stars, and honors will be gone.')) return;
    store.reset();
    toast(this.game, 'A fresh thread.');
  }
}
