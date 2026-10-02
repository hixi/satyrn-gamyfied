import { describe, it, expect } from 'vitest';
import { Store } from '../../src/store/store';
import { createInitialState } from '../../src/store/state';

describe('store notifications', () => {
  it('notifies subscribers on dispatch', () => {
    const s = new Store({ storage: null });
    let count = 0;
    s.subscribe(() => count++);
    s.dispatch({ type: 'world.entered', world: 'world.x' });
    expect(count).toBe(1);
  });

  it('notifies subscribers on reset', () => {
    const s = new Store({ storage: null });
    s.dispatch({ type: 'world.entered', world: 'world.x' });
    let count = 0;
    s.subscribe(() => count++);
    s.reset();
    expect(count).toBe(1);
  });

  it('notifies subscribers on import', () => {
    const s = new Store({ storage: null });
    let count = 0;
    s.subscribe(() => count++);
    s.import(JSON.stringify({ ...createInitialState(), visitedWorlds: ['world.y'] }));
    expect(count).toBe(1);
  });
});