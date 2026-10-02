/**
 * Scene keys in boot order. Phaser-free on purpose: the router bridge and
 * unit tests import these without booting a canvas.
 */
export const SCENE_KEYS = {
  boot: 'boot',
  title: 'title',
  map: 'map',
  world: 'world',
  notFound: 'not-found',
  hud: 'hud',
  dialogue: 'dialogue',
  journal: 'journal',
  actCard: 'act-card',
  toasts: 'toasts',
} as const;
