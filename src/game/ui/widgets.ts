import Phaser from 'phaser';
import { THEME } from '../theme';
import type { LayoutMode } from '../layout';
import { buttonSize } from './sizes';
import { createFocusRegistry, type FocusRegistry } from './focus';

/** Bar height the HUD actually uses: compact phones grow a second row. */
export function hudHeight(scene: Phaser.Scene): number {
  const compact = scene.scale.width < THEME.COMPACT_MAX_WIDTH;
  return compact ? THEME.HUD_HEIGHT_COMPACT : THEME.HUD_HEIGHT;
}
import type { SoundBank } from '../audio';

export type { ButtonSize } from './sizes';
export { buttonSize } from './sizes';

export interface ButtonOptions {
  id: string;
  text: string;
  mode?: LayoutMode;
  enabled?: boolean;
  onTap: () => void;
}

const FOCUS_KEY = '__satyrnFocus';

function color(hex: string): number {
  return Phaser.Display.Color.HexStringToColor(hex).color;
}

/** Scene keys whose buttons join the single global Tab order. */
const TABBED_SCENES = new Set(['hud', 'title', 'map', 'world', 'journal']);

/**
 * Per-scene focus registry, created on demand and stored on the scene.
 * Tab order lives on the canvas: the browser keeps DOM focus on `body` while
 * the scene tracks which widget is current and draws its ring.
 *
 * One scene owns Tab/Enter/Space at a time: every scene's keyboard plugin
 * hears every key, so per-scene handlers would each advance their own
 * registry. The owner is the topmost tabbed scene (map > title > hud).
 */
function tabOwner(game: Phaser.Game): string {
  const active = (key: string): boolean => {
    try {
      return game.scene.isActive(key);
    } catch {
      return false;
    }
  };
  // World content owns Tab when a world is open; the HUD bar is reached
  // from inside a world via pointer, not Tab. Everywhere else the topmost
  // tabbed scene (map > title > hud) owns it.
  if (active('journal')) return 'journal';
  if (active('world')) return 'world';
  if (active('map')) return 'map';
  if (active('title')) return 'title';
  return 'hud';
}

export function useFocus(scene: Phaser.Scene): FocusRegistry {
  const existing = (scene as unknown as Record<string, unknown>)[FOCUS_KEY] as FocusRegistry | undefined;
  if (existing) return existing;
  const registry = createFocusRegistry();
  (scene as unknown as Record<string, unknown>)[FOCUS_KEY] = registry;
  if (TABBED_SCENES.has(scene.scene.key)) {
    wireTabKeys(scene);
    scene.input.keyboard?.addCapture('TAB,ENTER,SPACE');
  }
  return registry;
}

const WIRED_KEY = '__satyrnTabWired';

/**
 * Attach Tab/Enter/Space to the scene's CURRENT registry. Each scene's
 * keyboard plugin is its own emitter, so wiring is once per plugin: the
 * handlers resolve the live registry on every keypress instead of closing
 * over it, and re-renders never touch the wiring.
 */
export function wireTabKeys(scene: Phaser.Scene): void {
  if ((scene as unknown as Record<string, unknown>)[WIRED_KEY] === scene.input.keyboard) return;
  (scene as unknown as Record<string, unknown>)[WIRED_KEY] = scene.input.keyboard;
  const keyboard = scene.input.keyboard;
  if (!keyboard) return;
  keyboard.on('keydown-TAB', (event: KeyboardEvent) => {
    if (tabOwner(scene.game) !== scene.scene.key) return;
    event.preventDefault();
    const focus = (scene as unknown as Record<string, unknown>)[FOCUS_KEY] as FocusRegistry | undefined;
    const id = focus?.move(event.shiftKey ? -1 : 1);
    if (id) highlightFocused(scene, id);
  });
  const onEnter = (event: KeyboardEvent) => {
    if (tabOwner(scene.game) !== scene.scene.key) return;
    event.preventDefault();
    activateFocused(scene);
  };
  keyboard.on('keydown-ENTER', onEnter);
  keyboard.on('keydown-SPACE', onEnter);
}

const RING_KEY = '__satyrnWidgets';

type SceneWidgets = {
  rings: Map<string, Phaser.GameObjects.Rectangle>;
  taps: Map<string, () => void>;
};

function widgetsOf(scene: Phaser.Scene): SceneWidgets {
  const stored = (scene as unknown as Record<string, unknown>)[RING_KEY] as SceneWidgets | undefined;
  if (stored) return stored;
  const fresh: SceneWidgets = { rings: new Map(), taps: new Map() };
  (scene as unknown as Record<string, unknown>)[RING_KEY] = fresh;
  return fresh;
}

function highlightFocused(scene: Phaser.Scene, id: string): void {
  const { rings } = widgetsOf(scene);
  for (const [ringId, ring] of rings) ring.setVisible(ringId === id);
}

/** Forget the focus wiring after the keyboard plugin is torn down (scene stop). */
export function resetFocusWiring(scene: Phaser.Scene): void {
  delete (scene as unknown as Record<string, unknown>)[FOCUS_KEY];
  // The plugin instance is fresh after a stop/start, so re-wire next create.
  if ((scene as unknown as Record<string, unknown>)[WIRED_KEY] !== scene.input.keyboard) {
    delete (scene as unknown as Record<string, unknown>)[WIRED_KEY];
  }
}

/**
 * Drop every tracked widget. Call AFTER destroying the old buttons:
 * destroy handlers only remove their own entries, so clearing first would
 * let a stale destroy wipe the new screen's ids.
 */
export function clearSceneWidgets(scene: Phaser.Scene): void {
  const stored = (scene as unknown as Record<string, unknown>)[RING_KEY] as SceneWidgets | undefined;
  stored?.rings.clear();
  stored?.taps.clear();
}

function activateFocused(scene: Phaser.Scene): void {
  const focus = (scene as unknown as Record<string, unknown>)[FOCUS_KEY] as FocusRegistry | undefined;
  const id = focus?.current();
  const tap = id ? widgetsOf(scene).taps.get(id) : undefined;
  tap?.();
}

function soundsOf(scene: Phaser.Scene): SoundBank | undefined {
  return scene.registry.get('sounds') as SoundBank | undefined;
}

function effectsOn(scene: Phaser.Scene): boolean {
  return scene.registry.get('reducedMotion') !== true && scene.registry.get('e2eSeed') == null;
}

/** One button style everywhere: rounded rect, focus ring, press pop, click blip. */
export function makeButton(scene: Phaser.Scene, opts: ButtonOptions): Phaser.GameObjects.Container {
  const size = buttonSize(opts.mode ?? 'expansive');
  const enabled = opts.enabled !== false;
  const label = scene.add
    .text(0, 0, opts.text, {
      fontFamily: THEME.fonts.body,
      fontSize: `${size.fontSize}px`,
      color: THEME.palette.ink,
    })
    .setOrigin(0.5);
  const w = Math.max(label.width + size.paddingX * 2, 160);
  const h = size.minHeight;
  const bg = scene.add
    .rectangle(0, 0, w, h, color(enabled ? THEME.palette.yellow : THEME.palette.greige))
    .setStrokeStyle(2, color(THEME.palette.charcoal));
  const ring = scene.add
    .rectangle(0, 0, w + 8, h + 8)
    .setStrokeStyle(3, color(THEME.palette.yellowDark))
    .setVisible(false);
  const container = scene.add.container(0, 0, [bg, label, ring]);
  container.setSize(w, h);
  container.setInteractive({ useHandCursor: true });
  if (!enabled) container.disableInteractive();

  const focus = useFocus(scene);
  focus.register(opts.id, enabled);
  // Disabled buttons never join the widget maps (no ring, no tap, no Tab).
  const widgets = widgetsOf(scene);
  const tap = () => {
    if (!enabled) return;
    soundsOf(scene)?.click();
    if (effectsOn(scene)) scene.tweens.add({ targets: container, scale: 0.96, duration: 60, yoyo: true });
    opts.onTap();
  };
  widgets.taps.set(opts.id, tap);
  widgets.rings.set(opts.id, ring);
  if (!enabled) {
    widgets.rings.delete(opts.id);
    widgets.taps.delete(opts.id);
  }

  container.on('pointerover', () => {
    if (!enabled) return;
    bg.setStrokeStyle(3, color(THEME.palette.yellowDark));
  });
  container.on('pointerout', () => bg.setStrokeStyle(2, color(THEME.palette.charcoal)));
  container.on('pointerup', tap);
  // No destroy cleanup: every scene owns its render lifecycle
  // (destroy-first-then-reset, or reset-then-rebuild on a fresh scene) and
  // clears the widget maps explicitly. Per-button destroy handlers cannot
  // distinguish a re-render teardown from a real removal — removeAll(true)
  // does not even emit destroy — so they only ever deleted live entries.
  return container;
}

/** One panel style: paper card with a charcoal edge. */
export function makePanel(scene: Phaser.Scene, w: number, h: number): Phaser.GameObjects.Container {
  const bg = scene.add
    .rectangle(0, 0, w, h, color(THEME.palette.paper))
    .setStrokeStyle(3, color(THEME.palette.charcoal));
  return scene.add.container(0, 0, [bg]);
}

export interface Meter {
  container: Phaser.GameObjects.Container;
  set(value: number): void;
}

/** Horizontal fill meter (coverage, progress). Value clamps to 0..1. */
export function makeMeter(scene: Phaser.Scene, w: number): Meter {
  const h = 14;
  const track = scene.add
    .rectangle(0, 0, w, h, color(THEME.palette.greige))
    .setStrokeStyle(2, color(THEME.palette.charcoal));
  const fill = scene.add.rectangle(-w / 2, 0, 0, h - 4, color(THEME.palette.yellow)).setOrigin(0, 0.5);
  fill.width = 0;
  const container = scene.add.container(0, 0, [track, fill]);
  return {
    container,
    set(value: number) {
      const clamped = Math.min(1, Math.max(0, value));
      fill.width = (w - 4) * clamped;
    },
  };
}

export interface Tabs {
  container: Phaser.GameObjects.Container;
  select(i: number): void;
  selected(): number;
}

export interface TabOptions {
  prefix?: string;
  onSelect?: (i: number) => void;
}

/** Tab strip: buttons in a row; selection is a visual state + index. */
export function makeTabs(
  scene: Phaser.Scene,
  labels: string[],
  mode: LayoutMode = 'expansive',
  opts: TabOptions = {},
): Tabs {
  let current = 0;
  const buttons: Phaser.GameObjects.Container[] = [];
  const container = scene.add.container(0, 0);
  labels.forEach((text, i) => {
    // Position left-to-right with compact-aware spacing.
    const size = buttonSize(mode);
    const button = makeButton(scene, {
      id: `${opts.prefix ?? 'tab'}-${i}`,
      text,
      mode,
      onTap: () => tabs.select(i),
    });
    button.setPosition(i * (160 + size.paddingX), 0);
    buttons.push(button);
    container.add(button);
  });
  const tabs: Tabs = {
    container,
    select(i: number) {
      if (i < 0 || i >= buttons.length) return;
      current = i;
      opts.onSelect?.(i);
    },
    selected: () => current,
  };
  return tabs;
}
