import type { Route } from '../router';
import { parseHash } from '../router';
import { SCENE_KEYS } from './scene-keys';

/** Where the journal Back button returns; session-only, resets to `#/` on reload. */
let returnTo = '#/';

export function getReturnTo(): string {
  return returnTo;
}

export function setReturnTo(hash: string): void {
  returnTo = hash;
}

/**
 * Change the URL hash; the hash listener drives the scene switch. When the
 * destination equals the current hash no event fires, so an explicit scene
 * switch carries the navigation instead of stranding on the old scene.
 */
export function navigate(hash: string): void {
  if (typeof window === 'undefined') return;
  if (window.location.hash === hash) {
    const game = (window as unknown as { game?: import('phaser').Game }).game;
    const route = parseHash(hash);
    const key = routeToSceneKey(route);
    if (game && key !== SCENE_KEYS.hud && key !== SCENE_KEYS.toasts) {
      for (const other of [SCENE_KEYS.title, SCENE_KEYS.map, SCENE_KEYS.world, SCENE_KEYS.notFound, SCENE_KEYS.journal]) {
        if (other !== key) game.scene.stop(other);
      }
      game.scene.start(key, route.name === 'world' ? { worldId: route.worldId } : {});
    }
    return;
  }
  window.location.hash = hash;
}

/** Legacy `#/thread` deep link lands on the map (mode comes from the store). */
export function normalizeRoute(route: Route, _mode: 'thread' | 'wander'): Route {
  if (route.name === 'thread') return { name: 'map' };
  return route;
}

export function routeToSceneKey(route: Route): string {
  switch (route.name) {
    case 'map':
    case 'thread':
      return SCENE_KEYS.map;
    case 'world':
      return SCENE_KEYS.world;
    case 'journal':
      return SCENE_KEYS.journal;
    case 'concept':
      return SCENE_KEYS.map;
    case 'notFound':
      return SCENE_KEYS.notFound;
  }
}
