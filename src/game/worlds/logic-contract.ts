/** Star bands shared by every world's logic module. Pure: no Phaser, no DOM. */

export interface StarBands {
  /** Max mistakes that still earn three stars. */
  three: number;
  /** Max mistakes that still earn two stars. */
  two: number;
}

export type WorldStars = 1 | 2 | 3;

/** Fewer mistakes, more stars: at most `three` → 3, at most `two` → 2, else 1. */
export function starsForMistakes(mistakes: number, bands: StarBands): WorldStars {
  if (mistakes <= bands.three) return 3;
  if (mistakes <= bands.two) return 2;
  return 1;
}
