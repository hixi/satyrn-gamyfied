import type { Route } from '../router';
import { SCENE_KEYS } from './scenes/boot';

/** Where the journal Back button returns; session-only, resets to `#/` on reload. */
let returnTo = '#/';

export function getReturnTo(): string {
  return returnTo;
}

export function setReturnTo(hash: string): void {
  returnTo = hash;
}

/** Change the URL hash; the hash listener drives the scene switch. */
export function navigate(hash: string): void {
  if (typeof window !== 'undefined') window.location.hash = hash;
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
