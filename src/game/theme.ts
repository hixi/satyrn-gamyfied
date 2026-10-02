/** Single visual source of truth: palette, spacing, type, radii, budgets. */

export const THEME = {
  palette: {
    yellow: '#e3d678',
    greige: '#efe4d2',
    charcoal: '#383330',
    yellowDark: '#433715',
    ink: '#2a2622',
    paper: '#fbf7ef',
    /** Dark backdrop for night/prologue rooms. */
    night: '#241f1b',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radii: { sm: 6, md: 10, lg: 16, pill: 999 },
  fontSizes: { sm: 14, md: 16, lg: 20, xl: 28 },
  fonts: {
    display: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
    body: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
  /** Minimum interactive target size in CSS px (touch + pointer). */
  MIN_TOUCH: 48,
  /** Viewport widths at or below this use the compact layout. */
  COMPACT_MAX_WIDTH: 700,
  /** HUD bar height in CSS px, before safe-area insets. */
  HUD_HEIGHT: 64,
} as const;

export type Theme = typeof THEME;
