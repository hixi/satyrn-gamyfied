export type Route =
  | { name: 'map' }
  | { name: 'thread' }
  | { name: 'world'; worldId: string }
  | { name: 'concept'; conceptId: string }
  | { name: 'journal' }
  | { name: 'notFound'; path: string };

/** Parse a location hash into a route. An unknown path yields `notFound`. */
export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '');
  const path = raw.replace(/^\/+/, '').replace(/\/+$/, '');
  if (path === '') return { name: 'map' };
  const segments = path.split('/');
  switch (segments[0]) {
    case 'thread':
      return { name: 'thread' };
    case 'journal':
      return { name: 'journal' };
    case 'world':
      return segments[1] ? { name: 'world', worldId: segments[1] } : { name: 'notFound', path };
    case 'concept':
      return segments[1] ? { name: 'concept', conceptId: segments[1] } : { name: 'notFound', path };
    default:
      return { name: 'notFound', path };
  }
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case 'map':
      return '#/';
    case 'thread':
      return '#/thread';
    case 'journal':
      return '#/journal';
    case 'world':
      return `#/world/${route.worldId}`;
    case 'concept':
      return `#/concept/${route.conceptId}`;
    case 'notFound':
      return `#/${route.path}`;
  }
}

export class Router {
  private readonly listeners = new Set<(route: Route) => void>();
  private onHashChange = () => this.emit();

  current(): Route {
    return parseHash(typeof location !== 'undefined' ? location.hash : '');
  }

  navigate(route: Route): void {
    if (typeof location !== 'undefined') location.hash = routeToHash(route);
    else this.emit();
  }

  subscribe(fn: (route: Route) => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  start(): void {
    if (typeof window !== 'undefined') window.addEventListener('hashchange', this.onHashChange);
  }

  stop(): void {
    if (typeof window !== 'undefined') window.removeEventListener('hashchange', this.onHashChange);
  }

  private emit(): void {
    const route = this.current();
    for (const listener of this.listeners) listener(route);
  }
}