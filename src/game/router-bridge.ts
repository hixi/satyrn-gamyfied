import type { Route } from '../router';
import { parseHash } from '../router';
import { SCENE_KEYS } from './scene-keys';

/** Where the journal Back button returns; session-only, resets to `#/` on reload. */
let returnTo = '#/';

/** The page's hash listener, registered by main(); same-hash navigate re-runs it. */
let onHashNavigation: (() => void) | null = null;

export function getReturnTo(): string {
  return returnTo;
}

export function setReturnTo(hash: string): void {
  returnTo = hash;
}

/** Register the hash-listener callback so same-hash navigations still switch. */
export function setNavigationItemSelectedListener(fn: () => void): void {
  onHashNavigation = fn;
}

/**
 * Change the URL hash; the hash listener drives the scene switch. When the
 * destination equals the current hash no event fires, so the registered
 * navigation listener re-runs the scene switch directly.
 */
export function navigate(hash: string): void {
  if (typeof window === 'undefined') return;
  if (window.location.hash === hash) {
    onHashNavigation?.();
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
