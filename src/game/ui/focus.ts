/** Keyboard focus order for one scene: wraps, skips disabled ids. Pure: no Phaser. */

export interface FocusRegistry {
  register(id: string, enabled?: boolean): void;
  unregister(id: string): void;
  setEnabled(id: string, enabled: boolean): void;
  move(dir: 1 | -1): string | null;
  current(): string | null;
}

export function createFocusRegistry(): FocusRegistry {
  const order: string[] = [];
  const enabled = new Map<string, boolean>();
  // -1 = before the first stop: the first Tab lands on order[0].
  let index = -1;

  const clamp = () => {
    if (!order.length || index < 0) return;
    index = ((index % order.length) + order.length) % order.length;
  };

  return {
    register(id, isEnabled = true) {
      // Registration defines order; the current stop survives re-renders
      // (same ids) but a shorter order clamps a stale index back in range.
      if (!order.includes(id)) order.push(id);
      enabled.set(id, isEnabled);
      // A fresh registry keeps index -1 (before the first stop). Once the
      // user has moved, re-registering clamps a stale index back in range.
      if (index >= 0) clamp();
    },
    unregister(id) {
      const at = order.indexOf(id);
      if (at === -1) return;
      order.splice(at, 1);
      enabled.delete(id);
      if (at < index) index -= 1;
      clamp();
    },
    setEnabled(id, isEnabled) {
      if (order.includes(id)) enabled.set(id, isEnabled);
    },
    move(dir) {
      if (!order.length) return null;
      // From the start position (-1) the first step lands on order[0].
      for (let step = 0; step < order.length; step++) {
        index = index < 0 ? (dir === 1 ? 0 : order.length - 1) : (index + dir + order.length) % order.length;
        if (enabled.get(order[index]) !== false) return order[index];
      }
      return null;
    },
    current() {
      if (!order.length) return null;
      // Before the first move there is no current stop yet.
      if (index < 0) return null;
      clamp();
      return order[index];
    },
  };
}
