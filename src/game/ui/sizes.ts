import { THEME } from '../theme';
import type { LayoutMode } from '../layout';

export interface ButtonSize {
  minHeight: number;
  fontSize: number;
  paddingX: number;
}

/** Pure sizing rule: compact screens get larger type; both meet the touch target. */
export function buttonSize(mode: LayoutMode): ButtonSize {
  return mode === 'compact'
    ? { minHeight: THEME.MIN_TOUCH + 8, fontSize: THEME.fontSizes.lg, paddingX: THEME.spacing.lg }
    : { minHeight: THEME.MIN_TOUCH, fontSize: THEME.fontSizes.md, paddingX: THEME.spacing.md };
}
