import { THEME } from './theme';

export type LayoutMode = 'compact' | 'expansive';

export interface SafeInsets {
  top: number;
  bottom: number;
}

export interface PlayRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Compact for portrait or narrow viewports; expansive otherwise. */
export function getLayoutMode(width: number, height: number): LayoutMode {
  return height > width || width < THEME.COMPACT_MAX_WIDTH ? 'compact' : 'expansive';
}

/** The board area below the HUD bar minus safe-area insets; never negative. */
export function computePlayRect(
  width: number,
  height: number,
  insets: SafeInsets,
  hudPx: number = THEME.HUD_HEIGHT,
): PlayRect {
  const y = hudPx + insets.top;
  return { x: 0, y, w: Math.max(0, width), h: Math.max(0, height - y - insets.bottom) };
}

/** Clamp a scroll offset so the visible window stays inside the content. */
export function clampScroll(offset: number, contentHeight: number, viewHeight: number): number {
  return Math.min(Math.max(0, contentHeight - viewHeight), Math.max(0, offset));
}
